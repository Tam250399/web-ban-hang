using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SalesManagerBE.Migrations
{
        public partial class AddSalesInvoice : Migration
    {
                protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "SalesInvoiceId",
                table: "StockTransactions",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "SalesInvoices",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    InvoiceDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PreparedByName = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SalesInvoices", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_StockTransactions_SalesInvoiceId",
                table: "StockTransactions",
                column: "SalesInvoiceId");

            migrationBuilder.AddForeignKey(
                name: "FK_StockTransactions_SalesInvoices_SalesInvoiceId",
                table: "StockTransactions",
                column: "SalesInvoiceId",
                principalTable: "SalesInvoices",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

                protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_StockTransactions_SalesInvoices_SalesInvoiceId",
                table: "StockTransactions");

            migrationBuilder.DropTable(
                name: "SalesInvoices");

            migrationBuilder.DropIndex(
                name: "IX_StockTransactions_SalesInvoiceId",
                table: "StockTransactions");

            migrationBuilder.DropColumn(
                name: "SalesInvoiceId",
                table: "StockTransactions");
        }
    }
}
