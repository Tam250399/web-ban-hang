---
name: them-api
description: Quy trình thêm hoặc sửa một endpoint API của dự án này, xuyên suốt từ Model/Migration/Controller ở backend .NET cho tới service ở Frontend React và Mobile Expo. Dùng skill này bất cứ khi nào công việc đụng tới Backend/SalesManagerBE (controller, DTO, DbSet, migration, service), hoặc khi cần gọi một API mới/đổi API cũ từ web hay app — kể cả khi người dùng chỉ nói "thêm chức năng X", "sửa API Y", "thêm bảng Z", "thêm trường vào sản phẩm". Ba tầng phải khớp nhau nên đừng chỉ sửa một tầng rồi dừng.
---

# Thêm / sửa API

API của dự án luôn tồn tại ở **ba nơi**: controller .NET, `services/*.js` bên web, và `services/*.js` bên mobile. Sửa lệch một tầng thì lỗi chỉ lộ ra lúc chạy thật, thường là trên điện thoại — nơi khó debug nhất. Vì vậy mặc định là làm đủ cả ba, trừ khi người dùng nói rõ chỉ cần một phía.

## Bản đồ tầng

| Việc | Nơi sửa |
|---|---|
| Bảng dữ liệu | `Backend/SalesManagerBE/Models/<Ten>.cs` + `DbSet` trong `Data/AppDbContext.cs` |
| Ràng buộc, index, seed | `OnModelCreating` trong `AppDbContext.cs` |
| Kiểu dữ liệu vào/ra | `Backend/SalesManagerBE/Models/Dtos/<Ten>Dto.cs` |
| Endpoint | `Backend/SalesManagerBE/Controllers/<Ten>Controller.cs` |
| Logic nặng, tái dùng | `Backend/SalesManagerBE/Services/` + đăng ký DI trong `Program.cs` |
| Gọi API từ web | `Frontend/sales-manager-fe/src/services/<ten>Service.js` |
| Gọi API từ app | `Mobile/sales-manager-mobile/src/services/<ten>Service.js` |

## Backend

Đọc `Controllers/ProductController.cs` trước khi viết controller mới — nó là mẫu đầy đủ nhất (CRUD, phân quyền, import/export Excel).

Quy ước bắt buộc giữ:

- Khai báo lớp: `[ApiController]`, `[Route("api/[controller]")]`, và `[Authorize(Roles = "Admin,Staff")]` ở cấp lớp. Endpoint nào khách vãng lai xem được thì gắn `[AllowAnonymous]` lên riêng action đó (xem `GetAll`/`GetById` của Product). Mặc định đóng, mở từng cái — ngược lại là cách để lộ dữ liệu.
- Vai trò trong hệ thống chỉ có ba: `Admin`, `Customer`, `Staff` (seed trong `AppDbContext`).
- Lỗi trả về dạng `BadRequest(new { message = "Câu tiếng Việt cho người dùng đọc" })`. Cả web và app đều đọc đúng trường `message` này để hiện toast; trả chuỗi trần hoặc `ModelState` thô là người dùng thấy "Lỗi 400".
- Danh sách dài thì `.Select(...)` xuống đúng các trường cần, đừng trả nguyên entity kèm navigation property — `ReferenceHandler.IgnoreCycles` cứu khỏi vòng lặp nhưng không cứu khỏi payload phình to.
- Lấy user hiện tại qua `ClaimsPrincipalExtensions` trong `Extensions/`, không tự parse claim.

## Migration

Database là **PostgreSQL** (`UseNpgsql` trong `Program.cs`), không phải SQL Server như README cũ viết. `Database/init.sql` là di sản, EF Core migration mới là nguồn sự thật.

```bash
dotnet ef migrations add TenMigrationCoNghia --project Backend/SalesManagerBE
```

Không cần chạy `database update` thủ công: `Program.cs` gọi `db.Database.Migrate()` lúc khởi động nên migration tự áp khi chạy app. Hệ quả cần nhớ: **migration hỏng làm app không boot được**, chứ không phải chỉ lỗi ở request đầu tiên. Mở file migration vừa sinh đọc lại trước khi chạy, nhất là khi có xoá cột hoặc đổi kiểu.

## Frontend web

`src/services/productService.js` là mẫu ngắn gọn nhất để bắt chước:

```js
import { BASE_URL, request, downloadFile } from './apiClient'

const URL = `${BASE_URL}/product`

export const productService = {
  getAll: ()          => request(URL),
  create: (data)      => request(URL, { method: 'POST', body: data }),
  update: (id, data)  => request(`${URL}/${id}`, { method: 'PUT', body: data }),
  remove: (id)        => request(`${URL}/${id}`, { method: 'DELETE' }),
}
```

- **Không gọi `fetch` trực tiếp trong component.** `apiClient.request` đã lo timeout 15s, `credentials: 'include'`, phân loại lỗi thành `ApiError` với `kind` là `network`/`timeout`/`auth`/`server`, và tự đưa người dùng về trạng thái khách khi phiên hết hạn. Gọi `fetch` tay là mất sạch những thứ đó.
- Tải file thì dùng `downloadFile` (hạn 60s, tự đọc tên từ `Content-Disposition`).
- Upload `FormData` là ngoại lệ duy nhất được `fetch` thẳng, vì `request` luôn đặt `Content-Type: application/json` — xem `previewImport` trong `productService.js`.

## Mobile

Giống web nhưng `request` nhận **đường dẫn tương đối**, không ghép `BASE_URL`:

```js
import { request } from './apiClient'

const URL = '/product'
export const productService = { getAll: () => request(URL) }
```

`services/config.js` tự dò địa chỉ backend (IP LAN của máy chạy Metro, hoặc `10.0.2.2` cho emulator Android). Đừng hardcode `localhost` — trên điện thoại `localhost` là chính cái điện thoại đó.

## Xác thực

Token nằm trong cookie **HttpOnly** tên `access_token`, không phải localStorage, không phải header `Authorization` tự gắn. Backend đọc cookie này trong `JwtBearerEvents.OnMessageReceived` (`Program.cs`). Mọi request phải đi kèm `credentials: 'include'` — `apiClient` đã làm sẵn.

## Kiểm chứng trước khi báo xong

```bash
dotnet build Backend/SalesManagerBE
```

Rồi chạy thật: backend qua `.claude/launch.json` (cấu hình `backend`, cổng 5000), web qua cấu hình `frontend` (cổng 5173, Vite proxy `/api` và `/chathub` sang backend). Endpoint mới có `[Authorize]` thì phải đăng nhập rồi mới thử được — gọi bằng `curl` không kèm cookie sẽ ra 401 và dễ tưởng nhầm là code sai.
