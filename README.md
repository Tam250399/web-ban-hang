# DỰ ÁN QUẢN LÝ BÁN HÀNG VẬT LIỆU XÂY DỰNG (BOILERPLATE)

## Cấu trúc thư mục
- `/Database`: Chứa script khởi tạo database cho SQL Server (`init.sql`).
- `/Backend`: Dự án .NET 8 Web API tích hợp sẵn DTO, Controller Login/Register và cấu hình kết nối MinIO.
- `/Frontend`: Dự án React chứa form Đăng ký và Đăng nhập chuẩn giao diện.

## Hướng dẫn chạy nhanh:
1. **Database**: Chạy script `init.sql` trong SQL Server của bạn.
2. **Backend**: 
   - Di chuyển vào thư mục `Backend/SalesManagerBE`
   - Chạy lệnh: `dotnet restore` và `dotnet run`
3. **Frontend**:
   - Di chuyển vào thư mục `Frontend/sales-manager-fe`
   - Cài đặt và cấu hình thư viện tùy chọn của bạn (`npm install`).
