# SalesManagerProject — quản lý bán hàng vật liệu xây dựng

Hệ thống gồm bốn phần trong một repo:

| Thư mục | Là gì |
|---|---|
| `Backend/SalesManagerBE` | .NET 8 Web API, EF Core, SignalR, MinIO |
| `Frontend/sales-manager-fe` | React 19 + Vite, PWA |
| `Mobile/sales-manager-mobile` | Expo / React Native |
| `Database` | `init.sql` — **di sản**, không còn là nguồn sự thật |
| `tests` | Playwright (cấu hình ở `playwright.config.ts`) |

## Chạy dự án

Dùng cấu hình có sẵn trong `.claude/launch.json` thay vì tự gõ lệnh chạy server:
`backend` (cổng 5000) và `frontend` (cổng 5173, Vite proxy `/api` và `/chathub` sang backend).

```bash
npm --prefix Mobile/sales-manager-mobile start
```

```bash
docker compose up -d --build
```

## Những điều dễ hiểu nhầm

- **Database là PostgreSQL**, không phải SQL Server — README ở gốc đã cũ. Nguồn sự thật là EF Core migration; `Program.cs` gọi `db.Database.Migrate()` lúc khởi động nên migration hỏng làm app không boot được.
- **Token nằm trong cookie HttpOnly `access_token`**, không phải localStorage, không phải header `Authorization`. Mọi request cần `credentials: 'include'` — `apiClient` đã lo sẵn.
- Backend đặt cookie với `Secure = !IsDevelopment()`. Chạy `ASPNETCORE_ENVIRONMENT=Production` qua http thì **đăng nhập hỏng im lặng**: API trả 200 nhưng trình duyệt vứt cookie. Xem skill `trien-khai`.
- Vai trò chỉ có ba: `Admin`, `Customer`, `Staff`.
- URL ảnh backend sinh ra trỏ `localhost`/`minio` — luôn đi qua `resolveMediaUrl()` trước khi hiển thị.

## Quy ước viết code

- Chữ hiện cho người dùng: tiếng Việt có dấu. Đường dẫn URL: tiếng Việt không dấu (`/san-pham/:id`).
- Comment viết tiếng Việt và giải thích **vì sao**, không mô tả lại code. `Frontend/sales-manager-fe/src/services/apiClient.js` là mẫu giọng văn đang dùng.
- Không gọi `fetch` trực tiếp trong component — luôn qua `services/*Service.js`, vốn đi qua `apiClient` (timeout, phân loại lỗi, xử lý 401 tập trung).
- Web và mobile mỗi bên có bộ hook/component dùng chung riêng. Kiểm tra `src/hooks/` và `src/components/common` (web) hoặc `src/components/ui` (mobile) trước khi viết mới.

## Skill của dự án

Trong `.claude/skills/`: `them-api`, `man-hinh-web`, `man-hinh-mobile`, `trien-khai`. Mỗi skill chứa quy trình và các bẫy đã gặp của phần tương ứng.
