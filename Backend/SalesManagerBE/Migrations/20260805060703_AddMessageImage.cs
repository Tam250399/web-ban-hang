using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesManagerBE.Migrations
{
        public partial class AddMessageImage : Migration
    {
                protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageUrl",
                table: "Messages",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);
        }

                protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageUrl",
                table: "Messages");
        }
    }
}
