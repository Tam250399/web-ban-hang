using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SalesManagerBE.Migrations
{
        public partial class AddCustomer : Migration
    {
                protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Customers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    FullName = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    PhoneNumber = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    Address = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    IsBusiness = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Customers", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Customers_PhoneNumber",
                table: "Customers",
                column: "PhoneNumber",
                unique: true);

            migrationBuilder.AddColumn<int>(
                name: "CustomerId",
                table: "SalesInvoices",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql(@"
                INSERT INTO ""Customers"" (""FullName"", ""PhoneNumber"", ""Address"", ""IsBusiness"", ""CreatedAt"")
                SELECT 'Khách chưa xác định', '0000000000', NULL, false, now()
                WHERE EXISTS (SELECT 1 FROM ""SalesInvoices"")
                  AND NOT EXISTS (SELECT 1 FROM ""Customers"" WHERE ""PhoneNumber"" = '0000000000');

                UPDATE ""SalesInvoices""
                SET ""CustomerId"" = (SELECT ""Id"" FROM ""Customers"" WHERE ""PhoneNumber"" = '0000000000')
                WHERE ""CustomerId"" IS NULL;
            ");

            migrationBuilder.AlterColumn<int>(
                name: "CustomerId",
                table: "SalesInvoices",
                type: "integer",
                nullable: false,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_SalesInvoices_CustomerId",
                table: "SalesInvoices",
                column: "CustomerId");

            migrationBuilder.AddForeignKey(
                name: "FK_SalesInvoices_Customers_CustomerId",
                table: "SalesInvoices",
                column: "CustomerId",
                principalTable: "Customers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

                protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SalesInvoices_Customers_CustomerId",
                table: "SalesInvoices");

            migrationBuilder.DropTable(
                name: "Customers");

            migrationBuilder.DropIndex(
                name: "IX_SalesInvoices_CustomerId",
                table: "SalesInvoices");

            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "SalesInvoices");
        }
    }
}
