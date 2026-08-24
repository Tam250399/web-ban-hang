using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesManagerBE.Migrations
{
    /// <inheritdoc />
    public partial class AddShowOnHomeToCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // defaultValue: true — mọi danh mục đang có (kể cả danh mục admin tự thêm
            // ngoài 7 danh mục seed sẵn) tiếp tục hiện ở trang chủ như hành vi cũ, thay
            // vì chỉ 7 danh mục seed như EF tự sinh ra (defaultValue: false + UpdateData
            // riêng từng Id 1-7).
            migrationBuilder.AddColumn<bool>(
                name: "ShowOnHome",
                table: "ProductCategories",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowOnHome",
                table: "ProductCategories");
        }
    }
}
