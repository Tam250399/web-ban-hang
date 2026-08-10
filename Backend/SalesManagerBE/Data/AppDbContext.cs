using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Models;
using SalesManagerBE.Services;

namespace SalesManagerBE.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

        public DbSet<User> Users => Set<User>();
        public DbSet<Role> Roles => Set<Role>();
        public DbSet<Product> Products => Set<Product>();
        public DbSet<StockTransaction> StockTransactions => Set<StockTransaction>();
        public DbSet<SalesInvoice> SalesInvoices => Set<SalesInvoice>();
        public DbSet<ProductCategory> ProductCategories => Set<ProductCategory>();
        public DbSet<UnitType> UnitTypes => Set<UnitType>();
        public DbSet<ProductNameTemplate> ProductNameTemplates => Set<ProductNameTemplate>();
        public DbSet<Banner> Banners => Set<Banner>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Roles seed
            modelBuilder.Entity<Role>().HasData(
                new Role { Id = 1, RoleName = "Admin" },
                new Role { Id = 2, RoleName = "Customer" },
                new Role { Id = 3, RoleName = "Staff" }
            );

            // User config
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

                entity.HasData(
                    new User
                    {
                        Id = 1,
                        Username = "admin",
                        PasswordHash = AuthService.HashPassword("Admin@123"),
                        FullName = "Quản trị viên",
                        RoleId = 1,
                        CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc)
                    }
                );
            });

            // ProductCategory seed
            modelBuilder.Entity<ProductCategory>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
                entity.HasData(
                    new ProductCategory { Id = 1, Name = "Xi măng" },
                    new ProductCategory { Id = 2, Name = "Gạch" },
                    new ProductCategory { Id = 3, Name = "Cát - Đá" },
                    new ProductCategory { Id = 4, Name = "Thép" },
                    new ProductCategory { Id = 5, Name = "Tôn - Mái" },
                    new ProductCategory { Id = 6, Name = "Cửa - Khung" },
                    new ProductCategory { Id = 7, Name = "Sơn" }
                );
            });

            // UnitType seed
            modelBuilder.Entity<UnitType>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(50);
                entity.HasData(
                    new UnitType { Id = 1, Name = "Bao 50kg" },
                    new UnitType { Id = 2, Name = "Viên" },
                    new UnitType { Id = 3, Name = "m³" },
                    new UnitType { Id = 4, Name = "Kg" },
                    new UnitType { Id = 5, Name = "m²" },
                    new UnitType { Id = 6, Name = "Bộ" },
                    new UnitType { Id = 7, Name = "Thùng" },
                    new UnitType { Id = 8, Name = "Tấm" },
                    new UnitType { Id = 9, Name = "Cái" },
                    new UnitType { Id = 10, Name = "Lít" }
                );
            });

            // ProductNameTemplate seed
            modelBuilder.Entity<ProductNameTemplate>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(200);
                entity.HasOne(e => e.Category)
                    .WithMany(c => c.ProductNameTemplates)
                    .HasForeignKey(e => e.CategoryId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.HasData(
                    new ProductNameTemplate { Id = 1, Name = "Xi măng Hà Tiên PC40", CategoryId = 1 },
                    new ProductNameTemplate { Id = 2, Name = "Xi măng Hà Tiên PCB30", CategoryId = 1 },
                    new ProductNameTemplate { Id = 3, Name = "Xi măng INSEE PC40", CategoryId = 1 },
                    new ProductNameTemplate { Id = 4, Name = "Gạch thẻ đặc 6x10x22", CategoryId = 2 },
                    new ProductNameTemplate { Id = 5, Name = "Gạch thẻ rỗng 6x10x22", CategoryId = 2 },
                    new ProductNameTemplate { Id = 6, Name = "Gạch block 10x20x40", CategoryId = 2 },
                    new ProductNameTemplate { Id = 7, Name = "Cát vàng xây dựng", CategoryId = 3 },
                    new ProductNameTemplate { Id = 8, Name = "Đá dăm 1x2", CategoryId = 3 },
                    new ProductNameTemplate { Id = 9, Name = "Sắt thép tròn phi 10", CategoryId = 4 },
                    new ProductNameTemplate { Id = 10, Name = "Sắt thép tròn phi 12", CategoryId = 4 },
                    new ProductNameTemplate { Id = 11, Name = "Tôn lạnh mạ kẽm 0.4mm", CategoryId = 5 },
                    new ProductNameTemplate { Id = 12, Name = "Tôn màu 0.45mm", CategoryId = 5 },
                    new ProductNameTemplate { Id = 13, Name = "Cửa sắt hộp 2 cánh", CategoryId = 6 },
                    new ProductNameTemplate { Id = 14, Name = "Sơn nước nội thất Jotun 18L", CategoryId = 7 },
                    new ProductNameTemplate { Id = 15, Name = "Sơn chống thấm Kova 20kg", CategoryId = 7 }
                );
            });

            // Product config
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
                entity.HasOne(e => e.ProductCategory)
                    .WithMany(c => c.Products)
                    .HasForeignKey(e => e.CategoryId)
                    .OnDelete(DeleteBehavior.SetNull);
                entity.HasOne(e => e.UnitType)
                    .WithMany(u => u.Products)
                    .HasForeignKey(e => e.UnitTypeId)
                    .OnDelete(DeleteBehavior.SetNull);

                entity.HasData(
                    new Product { Id = 1, ProductCode = "XM001", ProductName = "Xi măng Hà Tiên PC40", Unit = "Bao 50kg", Price = 95000, StockQuantity = 500, Category = "Xi măng", CategoryId = 1, UnitTypeId = 1, Description = "Xi măng Portland PC40", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                    new Product { Id = 2, ProductCode = "GT001", ProductName = "Gạch thẻ đặc 6x10x22", Unit = "Viên", Price = 2500, StockQuantity = 10000, Category = "Gạch", CategoryId = 2, UnitTypeId = 2, Description = "Gạch đất nung tiêu chuẩn", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                    new Product { Id = 3, ProductCode = "CT001", ProductName = "Cát vàng xây dựng", Unit = "m³", Price = 250000, StockQuantity = 200, Category = "Cát - Đá", CategoryId = 3, UnitTypeId = 3, Description = "Cát vàng sạch", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                    new Product { Id = 4, ProductCode = "ST001", ProductName = "Sắt thép tròn phi 10", Unit = "Kg", Price = 17500, StockQuantity = 1500, Category = "Thép", CategoryId = 4, UnitTypeId = 4, Description = "Thép tròn xây dựng phi 10mm", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                    new Product { Id = 5, ProductCode = "TN001", ProductName = "Tôn lạnh mạ kẽm 0.4mm", Unit = "m²", Price = 85000, StockQuantity = 800, Category = "Tôn - Mái", CategoryId = 5, UnitTypeId = 5, Description = "Tôn mạ kẽm dày 0.4mm", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                    new Product { Id = 6, ProductCode = "CX001", ProductName = "Cửa sắt hộp 2 cánh 1.2x2m", Unit = "Bộ", Price = 1800000, StockQuantity = 50, Category = "Cửa - Khung", CategoryId = 6, UnitTypeId = 6, Description = "Cửa sắt hộp sơn tĩnh điện", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                    new Product { Id = 7, ProductCode = "DA001", ProductName = "Đá dăm 1x2 xây dựng", Unit = "m³", Price = 320000, StockQuantity = 300, Category = "Cát - Đá", CategoryId = 3, UnitTypeId = 3, Description = "Đá dăm 1x2 dùng trộn bê tông", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) },
                    new Product { Id = 8, ProductCode = "SN001", ProductName = "Sơn nước nội thất Jotun 18L", Unit = "Thùng", Price = 1250000, StockQuantity = 120, Category = "Sơn", CategoryId = 7, UnitTypeId = 7, Description = "Sơn nước cao cấp", CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc) }
                );
            });

            // Banner config
            modelBuilder.Entity<Banner>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(200);
                entity.Property(e => e.ImageUrl).IsRequired().HasMaxLength(500);
            });

            // StockTransaction config
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
                entity.HasOne(e => e.SalesInvoice)
                    .WithMany(i => i.Items)
                    .HasForeignKey(e => e.SalesInvoiceId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // SalesInvoice config
            modelBuilder.Entity<SalesInvoice>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.CustomerName).IsRequired().HasMaxLength(200);
            });
        }
    }
}
