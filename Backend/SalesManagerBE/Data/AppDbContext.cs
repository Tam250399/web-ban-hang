using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Models;

namespace SalesManagerBE.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<StockTransaction> StockTransactions => Set<StockTransaction>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, RoleName = "Admin" },
                new Role { Id = 2, RoleName = "Customer" },
                new Role { Id = 3, RoleName = "Staff" }
            );

            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Username).IsRequired().HasMaxLength(50);
                entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(255);
                entity.Property(e => e.FullName).IsRequired().HasMaxLength(100);
                entity.Property(e => e.Email).HasMaxLength(100);
                entity.Property(e => e.PhoneNumber).HasMaxLength(15);
                entity.HasIndex(e => e.Username).IsUnique();
                entity.HasOne(e => e.Role)
                    .WithMany(r => r.Users)
                    .HasForeignKey(e => e.RoleId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Product>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.ProductCode).IsRequired().HasMaxLength(50);
                entity.Property(e => e.ProductName).IsRequired().HasMaxLength(200);
                entity.Property(e => e.Unit).IsRequired().HasMaxLength(50);
                entity.Property(e => e.Price).HasPrecision(18, 2);
                entity.Property(e => e.StockQuantity).HasPrecision(18, 2);
                entity.Property(e => e.Category).HasMaxLength(100);
                entity.HasIndex(e => e.ProductCode).IsUnique();

                entity.HasData(
                    new Product { Id = 1, ProductCode = "XM001", ProductName = "Xi măng Hà Tiên PC40", Unit = "Bao 50kg", Price = 95000, StockQuantity = 500, Category = "Xi măng", Description = "Xi măng Portland PC40, thích hợp xây dựng công trình dân dụng", CreatedAt = new DateTime(2024, 1, 1) },
                    new Product { Id = 2, ProductCode = "GT001", ProductName = "Gạch thẻ đặc 6x10x22", Unit = "Viên", Price = 2500, StockQuantity = 10000, Category = "Gạch", Description = "Gạch đất nung tiêu chuẩn, độ bền cao", CreatedAt = new DateTime(2024, 1, 1) },
                    new Product { Id = 3, ProductCode = "CT001", ProductName = "Cát vàng xây dựng", Unit = "m³", Price = 250000, StockQuantity = 200, Category = "Cát - Đá", Description = "Cát vàng sạch, phù hợp trộn bê tông và xây tường", CreatedAt = new DateTime(2024, 1, 1) },
                    new Product { Id = 4, ProductCode = "ST001", ProductName = "Sắt thép tròn phi 10", Unit = "Kg", Price = 17500, StockQuantity = 1500, Category = "Thép", Description = "Thép tròn xây dựng phi 10mm, cuộn dài 12m", CreatedAt = new DateTime(2024, 1, 1) },
                    new Product { Id = 5, ProductCode = "TN001", ProductName = "Tôn lạnh mạ kẽm 0.4mm", Unit = "m²", Price = 85000, StockQuantity = 800, Category = "Tôn - Mái", Description = "Tôn mạ kẽm dày 0.4mm, chống gỉ tốt", CreatedAt = new DateTime(2024, 1, 1) },
                    new Product { Id = 6, ProductCode = "CX001", ProductName = "Cửa sắt hộp 2 cánh 1.2x2m", Unit = "Bộ", Price = 1800000, StockQuantity = 50, Category = "Cửa - Khung", Description = "Cửa sắt hộp sơn tĩnh điện, khung chắc chắn", CreatedAt = new DateTime(2024, 1, 1) },
                    new Product { Id = 7, ProductCode = "DA001", ProductName = "Đá dăm 1x2 xây dựng", Unit = "m³", Price = 320000, StockQuantity = 300, Category = "Cát - Đá", Description = "Đá dăm 1x2 dùng trộn bê tông móng và sàn", CreatedAt = new DateTime(2024, 1, 1) },
                    new Product { Id = 8, ProductCode = "SN001", ProductName = "Sơn nước nội thất Jotun 18L", Unit = "Thùng", Price = 1250000, StockQuantity = 120, Category = "Sơn", Description = "Sơn nước cao cấp, bền màu, chịu ẩm tốt", CreatedAt = new DateTime(2024, 1, 1) }
                );
            });

            modelBuilder.Entity<StockTransaction>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Type).IsRequired().HasMaxLength(20);
                entity.Property(e => e.Quantity).HasPrecision(18, 2);
                entity.Property(e => e.UnitPrice).HasPrecision(18, 2);
                entity.HasOne(e => e.Product)
                    .WithMany(p => p.Transactions)
                    .HasForeignKey(e => e.ProductId)
                    .OnDelete(DeleteBehavior.Cascade);
            });
        }
    }
}
