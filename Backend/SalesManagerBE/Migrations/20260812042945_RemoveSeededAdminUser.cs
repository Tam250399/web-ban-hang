using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesManagerBE.Migrations
{
    /// <inheritdoc />
    // Không xoá hàng admin (Id=1): trên DB đã có dữ liệu thật (vd. tin nhắn chat do admin gửi),
    // xoá sẽ vi phạm khoá ngoại FK_Messages_Users_SenderId. Thay vào đó chỉ vô hiệu hoá mật khẩu
    // "Admin@123" cũ (đã bị lộ vì từng nằm trong mã nguồn) bằng cách xoay sang một mật khẩu ngẫu
    // nhiên mới — hash dùng thuật toán PBKDF2 có salt hiện tại thay vì SHA-256 không salt cũ.
    // Mật khẩu mới: xem ghi chú triển khai / kênh nội bộ — hãy đăng nhập và đổi lại ngay.
    public partial class RemoveSeededAdminUser : Migration
    {
        private const string RotatedPasswordHash = "100000.z4d6F+uCWD1yqRPzzXG+PA==.cwiDOz7HXoKUa7MxyzKJKj8C3j4DAEPBPzmFJIexqak=";
        private const string OldLeakedPasswordHash = "E86F78A8A3CAF0B60D8E74E5942AA6D86DC150CD3C03338AEF25B7D2D7E3ACC7";

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: RotatedPasswordHash);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: OldLeakedPasswordHash);
        }
    }
}
