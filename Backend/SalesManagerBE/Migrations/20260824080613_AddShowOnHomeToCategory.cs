using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesManagerBE.Migrations
{
        public partial class AddShowOnHomeToCategory : Migration
    {
                protected override void Up(MigrationBuilder migrationBuilder)
        {

            migrationBuilder.AddColumn<bool>(
                name: "ShowOnHome",
                table: "ProductCategories",
                type: "boolean",
                nullable: false,
                defaultValue: true);
        }

                protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ShowOnHome",
                table: "ProductCategories");
        }
    }
}
