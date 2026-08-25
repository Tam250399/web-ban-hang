---
name: trien-khai
description: Triển khai và vận hành dự án bằng Docker Compose — biến môi trường bí mật, nginx reverse proxy, CORS, MinIO, cấu hình app mobile trỏ về server, và cái bẫy cookie Secure làm đăng nhập hỏng im lặng khi chạy qua http. Dùng skill này khi người dùng nói tới deploy, triển khai, đưa lên VM/Proxmox/server, dựng domain, bật HTTPS, "chạy được ở máy tôi mà lên server lỗi", đăng nhập được ở dev nhưng không được ở production, ảnh không hiện sau khi deploy, hoặc khi sửa docker-compose.yml, Dockerfile, nginx.conf.template.
---

# Triển khai

Toàn hệ thống chạy bằng `docker-compose.yml` ở gốc repo: `postgres` + `minio` + `backend` (.NET) + `web` (nginx phục vụ bản build tĩnh và forward `/api`, `/chathub`, `/media`). Hướng dẫn từng bước cho VM Proxmox nằm ở [HUONG_DAN_TRIEN_KHAI_PROXMOX.md](HUONG_DAN_TRIEN_KHAI_PROXMOX.md) — đọc nó khi người dùng đang dựng máy mới.

```bash
docker compose up -d --build
```

## Bẫy số 1: cookie Secure — đăng nhập hỏng mà không báo lỗi

Đây là lỗi tốn thời gian nhất của dự án này, và triệu chứng của nó đánh lừa người ta.

`AuthController` đặt cookie phiên với `Secure = !_env.IsDevelopment()`. Nghĩa là chạy với `ASPNETCORE_ENVIRONMENT=Production` (đúng như `docker-compose.yml` đang đặt) thì cookie `access_token` **chỉ được trình duyệt lưu khi kết nối là https**. Truy cập qua `http://<ip>:8080`, API `/auth/login` vẫn trả 200 kèm thông tin người dùng, nhưng trình duyệt lặng lẽ vứt cookie đi — và request kế tiếp là 401. Người dùng thấy "đăng nhập xong lại bị đá ra", không có lỗi nào trong log backend.

Ba cách xử lý, theo thứ tự nên chọn:

1. Có domain + HTTPS thật (mục 7 trong hướng dẫn Proxmox). Đây là cách đúng.
2. Thử nội bộ tạm thời: đặt `ASPNETCORE_ENVIRONMENT=Development` cho service `backend` — chấp nhận cookie đi qua mạng không mã hoá, chỉ dùng trong LAN kín.
3. Không được "sửa" bằng cách chuyển token sang localStorage. Cookie HttpOnly là lựa chọn có chủ đích để chống XSS.

Cùng cái bẫy này áp cho app mobile: `Mobile/sales-manager-mobile/src/services/config.js` có cảnh báo tương ứng ở chỗ `resolveProdServerUrl`.

## Biến môi trường

`.env` nằm cạnh `docker-compose.yml`, chép từ `.env.example`, **không commit** (đã có trong `.gitignore`). Các khoá bắt buộc:

| Biến | Ghi chú |
|---|---|
| `POSTGRES_PASSWORD` | |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | Không để `minioadmin`; backend sẽ in cảnh báo nếu thiếu và tự dùng mặc định |
| `JWT_KEY` | >= 32 ký tự, `openssl rand -base64 48`. Thiếu là backend ném lỗi ngay lúc khởi động |
| `CORS_ALLOWED_ORIGINS` | Đúng origin web sẽ dùng, phân tách bằng dấu phẩy |
| `ADMIN_BOOTSTRAP_PASSWORD` | Chỉ để tạo tài khoản admin đầu tiên; đăng nhập, đổi mật khẩu, rồi xoá dòng này |

Hiện các secret này đọc từ `.env` qua interpolation của Compose. Nếu người dùng muốn chặt hơn (Docker secrets, vault) thì đó là việc riêng — đừng tự đổi khi chưa được yêu cầu.

## Bẫy số 2: CORS

`Program.cs` dùng `AllowCredentials()`, mà `AllowCredentials` **không đi kèm được** `AllowAnyOrigin()` — cookie sẽ không gửi được. Vì vậy `CORS_ALLOWED_ORIGINS` phải liệt kê origin cụ thể, khớp chính xác cả scheme và cổng (`https://banhang.example.com` khác `http://banhang.example.com` khác `https://banhang.example.com:8080`).

## Bẫy số 3: ảnh không hiện sau khi deploy

Backend sinh URL ảnh theo `Minio:Endpoint`. Trong Compose nó là `minio:9000` — tên chỉ phân giải được bên trong mạng Docker, trình duyệt người dùng không hiểu. Hai lớp cùng xử lý:

- nginx có route `/media/` proxy sang MinIO, nên web build với `VITE_MEDIA_URL=/media` (đã đặt sẵn trong `docker-compose.yml`) là ảnh cùng origin, không cần mở cổng 9000 ra ngoài.
- Phía client, `resolveMediaUrl()` (cả web lẫn mobile) viết lại hostname cục bộ về đúng host đang mở.

Ảnh hỏng sau deploy thì kiểm tra hai chỗ này trước khi nghi ngờ MinIO.

## Bẫy số 4: chat mất kết nối

SignalR chạy WebSocket. Nếu đặt thêm một reverse proxy nữa ở ngoài (Nginx Proxy Manager, Cloudflare, Caddy...), route `/chathub` phải giữ header `Upgrade`/`Connection` và timeout dài — `Frontend/sales-manager-fe/nginx.conf.template` đã làm đúng, lớp proxy ngoài thường là chỗ bị quên.

## Migration khi cập nhật

Backend gọi `db.Database.Migrate()` lúc khởi động, nên deploy bản mới là migration tự chạy. Hệ quả: **migration lỗi làm container backend không boot**. Sau `docker compose up -d --build`, luôn xem log trước khi báo là xong:

```bash
docker compose logs -f backend
```

## Trạng thái hiện tại của repo

`Dockerfile` của backend và web đã có, `nginx.conf.template` đã có, PWA đã cấu hình. Phần chưa làm: HTTPS/domain thật cho cả web và mobile. Nếu người dùng hỏi "còn thiếu gì để chạy thật", đó là câu trả lời.
