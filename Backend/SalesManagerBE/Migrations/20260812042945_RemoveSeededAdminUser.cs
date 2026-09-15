using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SalesManagerBE.Migrations
{

    public partial class RemoveSeededAdminUser : Migration
    {
        private const string RotatedPasswordHash = "100000.z4d6F+uCWD1yqRPzzXG+PA==.cwiDOz7HXoKUa7MxyzKJKj8C3j4DAEPBPzmFJIexqak=";
        private const string OldLeakedPasswordHash = "E86F78A8A3CAF0B60D8E74E5942AA6D86DC150CD3C03338AEF25B7D2D7E3ACC7";

                protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: RotatedPasswordHash);
        }

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
