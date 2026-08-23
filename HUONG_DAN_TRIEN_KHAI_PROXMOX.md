# Hướng dẫn triển khai dự án "web-ban-hang" lên Proxmox

Bạn đã cài Proxmox VE lên máy chủ và đang ở màn hình tạo VM (thấy `qemu/100` — tức
VM ID 100 — kèm ISO đã gắn). Dưới đây là toàn bộ các bước còn lại, theo đúng thứ tự,
để đưa dự án (.NET 8 API + React + PostgreSQL + MinIO, đóng gói bằng Docker Compose)
lên chạy trên máy chủ đó.

## 0. Tổng quan kiến trúc sẽ triển khai

```
Máy chủ vật lý (Proxmox VE)
  └─ VM Ubuntu Server 24.04 LTS  (VM 100)
       └─ Docker Engine
            ├─ container postgres   (CSDL)
            ├─ container minio      (lưu ảnh/file)
            ├─ container backend    (.NET 8 API, build từ /Backend)
            └─ container web        (nginx phục vụ React đã build + reverse proxy)
```

Người dùng truy cập `http://<IP-VM>:8080` → nginx phục vụ giao diện, và chuyển tiếp
`/api`, `/chathub`, `/media` sang backend/MinIO ở phía sau.

## 1. Tạo máy ảo (VM) trong Proxmox

Bạn đang ở đúng bước này. Trong wizard "Create VM":

- **General**: đặt tên VM (vd `web-ban-hang`), giữ VM ID mặc định (100).
- **OS**: chọn ISO bạn đã tải lên (khuyến nghị **Ubuntu Server 24.04 LTS**, nhẹ và
  nhiều tài liệu). Nếu chưa có ISO, vào **local (storage) → ISO Images → Upload**
  để tải file `.iso` từ ubuntu.com lên trước.
- **System**: để mặc định (BIOS: OVMF/UEFI hoặc SeaBIOS đều được, Machine: q35).
- **Disks**: tối thiểu **40 GB** (dự án + Docker images + dữ liệu Postgres/MinIO
  sẽ tăng dần theo thời gian, nên có thể để 60-80 GB nếu ổ đĩa máy chủ còn dư).
- **CPU**: tối thiểu 2 core (khuyến nghị 2-4 core).
- **Memory**: tối thiểu **4096 MB**, khuyến nghị **6144-8192 MB** (Postgres +
  MinIO + .NET runtime + nginx cộng lại không nhẹ).
- **Network**: để bridge mặc định `vmbr0` — nghĩa là VM sẽ có IP trong cùng dải
  mạng LAN với máy chủ Proxmox (192.168.1.x giống Proxmox của bạn).
- Bấm **Finish**, sau đó **Start** VM và mở **Console** (noVNC) để cài hệ điều hành.

## 2. Cài Ubuntu Server trong VM

Chạy trình cài đặt như bình thường:

- Ngôn ngữ, bàn phím: mặc định hoặc tiếng Việt tùy bạn.
- Network: chọn **cấu hình IP tĩnh** cho VM (hoặc đặt DHCP reservation trên
  router theo MAC của VM) — ví dụ `192.168.1.150/24`, gateway `192.168.1.1`.
  IP tĩnh giúp bạn không phải tìm lại IP mỗi lần VM khởi động lại.
- Ổ đĩa: dùng toàn bộ đĩa ảo đã cấp (LVM mặc định là được).
- **Tích chọn "Install OpenSSH server"** trong bước profile — để sau này SSH vào
  VM từ máy tính của bạn thay vì phải mở console Proxmox mỗi lần.
- Bỏ qua phần chọn "featured server snaps" (không cần).
- Tạo username/password cho tài khoản quản trị VM, hoàn tất cài đặt, reboot.

Sau khi cài xong, lấy IP của VM bằng lệnh `ip a` trong console, rồi từ máy tính
của bạn SSH vào để làm các bước tiếp theo cho tiện (copy-paste lệnh dễ hơn nhiều
so với gõ trong console Proxmox):

```bash
ssh <username>@192.168.1.150
```

## 3. Cài Docker và kéo mã nguồn về VM

Trong repo dự án đã có sẵn 2 file được chuẩn bị cho bước này:
`setup-vm.sh` và `.env.example` (đặt cùng cấp với `docker-compose.yml`, và
`Dockerfile` mới cho backend tại `Backend/SalesManagerBE/Dockerfile`).

Trên VM vừa cài, chạy:

```bash
git clone https://github.com/Tam250399/web-ban-hang.git
cd web-ban-hang
chmod +x setup-vm.sh
./setup-vm.sh
```

Script này sẽ: cập nhật hệ thống, cài Docker Engine + Docker Compose plugin, mở
firewall (SSH + cổng 8080), và tạo file `.env` từ `.env.example` nếu chưa có.

> Nếu bạn để Claude thao tác trực tiếp giúp, các file trên đã được chuẩn bị sẵn
> trong dự án ở máy bạn — chỉ cần đẩy (`git push`) lên GitHub rồi `git clone`
> trên VM là dùng được ngay.

## 4. Điền thông tin bí mật (mật khẩu, JWT key)

**Không dùng lại** các mật khẩu mặc định hiện có trong `docker-compose.yml` cũ
(`Tam2503`, `minioadmin`) khi đưa lên môi trường thật. Mở file `.env` vừa được
tạo và điền:

```bash
nano .env
```

- `POSTGRES_PASSWORD`: mật khẩu mạnh, tự đặt.
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`: đổi khỏi `minioadmin`.
- `JWT_KEY`: tạo bằng `openssl rand -base64 48`.
- `CORS_ALLOWED_ORIGINS`: địa chỉ bạn sẽ dùng để truy cập web, vd
  `http://192.168.1.150:8080` (hoặc domain thật nếu có, xem mục 7).
- `ADMIN_BOOTSTRAP_PASSWORD`: mật khẩu cho tài khoản `admin` sẽ được tự tạo lần
  đầu backend khởi động. **Xóa dòng này khỏi `.env` sau khi đã đăng nhập đổi mật
  khẩu**, để tránh lộ mật khẩu admin nếu ai đó đọc được file.

## 5. Build và chạy toàn bộ hệ thống

```bash
docker compose up -d --build
docker compose ps
```

Lần đầu build backend (.NET) và frontend (Vite) sẽ mất vài phút. Sau khi các
container ở trạng thái `running`/`healthy`, truy cập:

```
http://192.168.1.150:8080
```

Kiểm tra log nếu có lỗi:

```bash
docker compose logs -f backend
docker compose logs -f web
```

Backend tự chạy migration EF Core và tự seed tài khoản admin đầu tiên khi khởi
động (đã có sẵn trong `Program.cs`) — không cần chạy `init.sql` thủ công như
README cũ mô tả (README đó viết cho cách chạy không dùng Docker).

## 6. Bảo mật cơ bản

- Đổi toàn bộ mật khẩu mặc định (bước 4) trước khi mở cổng ra ngoài Internet.
- Cấu hình firewall trên chính Proxmox (Datacenter → Firewall) hoặc `ufw` trên
  VM chỉ mở cổng 8080 (và 22 cho SSH) ra ngoài; không cần mở 5432/9000/9001 ra
  khỏi mạng LAN — các service đó chỉ cần được các container khác gọi tới qua
  mạng nội bộ Docker.
- Nếu truy cập SSH từ ngoài Internet, đổi cổng SSH mặc định hoặc dùng key thay
  vì mật khẩu.
- Bật snapshot/backup định kỳ cho VM ngay trong Proxmox (mục 8) trước khi thao
  tác lớn.

## 7. (Tùy chọn) Domain + HTTPS

Nếu muốn truy cập bằng tên miền và HTTPS thay vì `http://IP:8080`:

1. Trỏ domain (A record) về IP công khai của mạng bạn, và cấu hình NAT/port
   forward trên router: cổng 80/443 ngoài Internet → IP VM: 8080 (hoặc đổi
   nginx sang nghe cổng 80 trực tiếp).
2. Cách đơn giản nhất: đặt thêm một **reverse proxy** (Caddy hoặc Nginx Proxy
   Manager) chạy trên VM, đứng trước container `web`, tự xin chứng chỉ Let's
   Encrypt và forward vào `localhost:8080`. Đây là việc làm thêm sau khi hệ
   thống đã chạy ổn ở bước 5-6.

## 8. Backup bằng tính năng của Proxmox

Proxmox có sẵn cơ chế backup/snapshot ở cấp VM, nên tận dụng thay vì tự viết
script backup phức tạp:

- **Datacenter → Backup**: đặt lịch backup tự động (vd hằng đêm) cho VM 100
  sang một storage khác (ổ đĩa thứ 2, NAS, hoặc thư mục local `/var/lib/vz`).
- **Snapshot** (trong VM → Snapshots): chụp nhanh trước khi làm thay đổi lớn
  (nâng cấp OS, sửa cấu hình mạng...) để có thể rollback ngay nếu lỗi.
- Backup ở cấp VM sẽ sao lưu luôn dữ liệu Postgres/MinIO (nằm trong Docker
  volume, tức nằm trong ổ đĩa ảo của VM) — không cần backup riêng CSDL, tuy
  nhiên nếu muốn an toàn hơn có thể thêm `pg_dump` định kỳ ra file rồi copy
  ra ngoài VM.

## 9. Cập nhật dự án sau này

Mỗi khi có thay đổi code và muốn đẩy bản mới lên:

```bash
cd ~/web-ban-hang
git pull
docker compose up -d --build
```

Docker Compose sẽ build lại các image thay đổi và khởi động lại container
tương ứng, không ảnh hưởng tới dữ liệu trong các volume `postgres-data` /
`minio-data`.

---

## Checklist tóm tắt

- [ ] Tạo VM trong Proxmox (2-4 core, 4-8 GB RAM, 40-80 GB đĩa, bridge vmbr0)
- [ ] Cài Ubuntu Server 24.04 (bật OpenSSH), đặt IP tĩnh
- [ ] SSH vào VM, clone repo
- [ ] Chạy `setup-vm.sh` để cài Docker + mở firewall
- [ ] Tạo `.env` từ `.env.example`, đổi hết mật khẩu mặc định
- [ ] `docker compose up -d --build`, kiểm tra `docker compose ps` và log
- [ ] Truy cập `http://<IP-VM>:8080`, đăng nhập admin, đổi mật khẩu, xóa
      `ADMIN_BOOTSTRAP_PASSWORD` khỏi `.env`
- [ ] Đặt lịch backup VM trong Proxmox
- [ ] (Tùy chọn) Domain + HTTPS qua reverse proxy
