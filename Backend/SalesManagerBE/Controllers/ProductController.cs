using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Data;
using SalesManagerBE.Models;
using SalesManagerBE.Models.Dtos;
using SalesManagerBE.Services;

namespace SalesManagerBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff")]
    public class ProductController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IProductExcelService _excelService;
        public ProductController(AppDbContext context, IProductExcelService excelService)
        {
            _context = context;
            _excelService = excelService;
        }

        [HttpGet]
        [AllowAnonymous]
        /// <summary>
        /// Lấy danh sách tất cả sản phẩm kèm danh mục và đơn vị tính
        /// </summary>
        public async Task<IActionResult> GetAll()
        {
            var products = await _context.Products
                .Include(p => p.ProductCategory)
                .Include(p => p.UnitType)
                .OrderBy(p => p.Category).ThenBy(p => p.ProductName)
                .Select(p => new {
                    p.Id, p.ProductCode, p.ProductName, p.Unit, p.Price,
                    p.StockQuantity, p.Description, p.ImageUrl, p.Category,
                    p.CategoryId, categoryName = p.ProductCategory != null ? p.ProductCategory.Name : p.Category,
                    p.UnitTypeId, unitTypeName = p.UnitType != null ? p.UnitType.Name : p.Unit,
                    p.CreatedAt
                })
                .ToListAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        /// <summary>
        /// Lấy chi tiết thông tin một sản phẩm theo ID
        /// </summary>
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _context.Products.Include(p => p.ProductCategory).Include(p => p.UnitType).FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpPost]
        /// <summary>
        /// Thêm mới một sản phẩm vào danh mục
        /// </summary>
        public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
        {
            if (await _context.Products.AnyAsync(p => p.ProductCode == dto.ProductCode))
                return BadRequest(new { message = "Mã sản phẩm đã tồn tại." });

            string? categoryName = dto.Category;
            if (dto.CategoryId.HasValue)
            {
                var cat = await _context.ProductCategories.FindAsync(dto.CategoryId.Value);
                categoryName = cat?.Name ?? dto.Category;
            }

            string unitName = dto.Unit;
            if (dto.UnitTypeId.HasValue)
            {
                var unit = await _context.UnitTypes.FindAsync(dto.UnitTypeId.Value);
                unitName = unit?.Name ?? dto.Unit;
            }

            var product = new Product
            {
                ProductCode = dto.ProductCode,
                ProductName = dto.ProductName,
                Unit = unitName,
                Price = dto.Price,
                StockQuantity = dto.StockQuantity,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                Category = categoryName,
                CategoryId = dto.CategoryId,
                UnitTypeId = dto.UnitTypeId
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();
            return Ok(new {
                product.Id, product.ProductCode, product.ProductName, product.Unit,
                product.Price, product.StockQuantity, product.Description, product.ImageUrl,
                product.Category, product.CategoryId, product.UnitTypeId, product.CreatedAt
            });
        }

        [HttpPut("{id}")]
        /// <summary>
        /// Cập nhật thông tin chi tiết của sản phẩm theo ID
        /// </summary>
        public async Task<IActionResult> Update(int id, [FromBody] CreateProductDto dto)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            string? categoryName = dto.Category;
            if (dto.CategoryId.HasValue)
            {
                var cat = await _context.ProductCategories.FindAsync(dto.CategoryId.Value);
                categoryName = cat?.Name ?? dto.Category;
            }

            string unitName = dto.Unit;
            if (dto.UnitTypeId.HasValue)
            {
                var unit = await _context.UnitTypes.FindAsync(dto.UnitTypeId.Value);
                unitName = unit?.Name ?? dto.Unit;
            }

            product.ProductName = dto.ProductName;
            product.Unit = unitName;
            product.Price = dto.Price;
            product.Description = dto.Description;
            product.ImageUrl = dto.ImageUrl;
            product.Category = categoryName;
            product.CategoryId = dto.CategoryId;
            product.UnitTypeId = dto.UnitTypeId;

            await _context.SaveChangesAsync();
            return Ok(new {
                product.Id, product.ProductCode, product.ProductName, product.Unit,
                product.Price, product.StockQuantity, product.Description, product.ImageUrl,
                product.Category, product.CategoryId, product.UnitTypeId, product.CreatedAt
            });
        }

        [HttpDelete("{id}")]
        /// <summary>
        /// Xóa sản phẩm khỏi hệ thống (nếu chưa có đơn hàng liên quan)
        /// </summary>
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();

            if (await _context.OrderItems.AnyAsync(i => i.ProductId == id))
                return BadRequest(new { message = "Không thể xóa sản phẩm đã có trong đơn hàng." });

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa sản phẩm." });
        }

        [HttpGet("export")]
        /// <summary>
        /// Xuất danh sách toàn bộ sản phẩm ra file Excel (.xlsx)
        /// </summary>
        public async Task<IActionResult> Export()
        {
            var products = await _context.Products.OrderBy(p => p.ProductCode).ToListAsync();
            var bytes = _excelService.ExportProducts(products);
            var fileName = $"DanhSachSanPham_{DateTime.Now:ddMMyyyy}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("import-template")]
        /// <summary>
        /// Tải về file Excel mẫu để nhập danh sách sản phẩm
        /// </summary>
        public async Task<IActionResult> ImportTemplate()
        {
            var categories = await _context.ProductCategories.OrderBy(c => c.Name).Select(c => c.Name).ToListAsync();
            var units = await _context.UnitTypes.OrderBy(u => u.Name).Select(u => u.Name).ToListAsync();
            var bytes = _excelService.GenerateImportTemplate(categories, units);
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "MauNhapSanPham.xlsx");
        }

        [HttpPost("import/preview")]
        /// <summary>
        /// Xem trước và kiểm tra tính hợp lệ dữ liệu từ file Excel nhập sản phẩm
        /// </summary>
        public async Task<IActionResult> ImportPreview(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn file." });

            List<ProductImportRawRow> rawRows;
            try
            {
                using var stream = file.OpenReadStream();
                rawRows = _excelService.ParseImportFile(stream);
            }
            catch
            {
                return BadRequest(new { message = "Không đọc được file. Vui lòng dùng đúng file mẫu (.xlsx)." });
            }

            if (rawRows.Count == 0)
                return BadRequest(new { message = "File không có dữ liệu." });

            var existingCodes = await _context.Products.Select(p => p.ProductCode).ToListAsync();
            var categories = await _context.ProductCategories.ToListAsync();
            var units = await _context.UnitTypes.ToListAsync();
            var seenCodes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            var preview = new List<ProductImportPreviewRowDto>();
            foreach (var row in rawRows)
            {
                var messages = new List<string>();
                var status = "New";

                if (string.IsNullOrWhiteSpace(row.ProductCode)) messages.Add("Thiếu mã sản phẩm.");
                if (string.IsNullOrWhiteSpace(row.ProductName)) messages.Add("Thiếu tên sản phẩm.");
                if (row.Price <= 0) messages.Add("Giá bán phải lớn hơn 0.");

                if (!string.IsNullOrWhiteSpace(row.CategoryName) &&
                    !categories.Any(c => c.Name.Equals(row.CategoryName, StringComparison.OrdinalIgnoreCase)))
                    messages.Add($"Danh mục \"{row.CategoryName}\" không tồn tại.");

                if (!string.IsNullOrWhiteSpace(row.UnitName) &&
                    !units.Any(u => u.Name.Equals(row.UnitName, StringComparison.OrdinalIgnoreCase)))
                    messages.Add($"Đơn vị \"{row.UnitName}\" không tồn tại.");

                if (messages.Count > 0)
                {
                    status = "Invalid";
                }
                else if (!seenCodes.Add(row.ProductCode.ToUpperInvariant()))
                {
                    status = "Invalid";
                    messages.Add("Mã sản phẩm bị lặp lại trong file.");
                }
                else if (existingCodes.Any(c => c.Equals(row.ProductCode, StringComparison.OrdinalIgnoreCase)))
                {
                    status = "Duplicate";
                    messages.Add("Mã sản phẩm đã tồn tại trong hệ thống.");
                }

                preview.Add(new ProductImportPreviewRowDto
                {
                    RowNumber = row.RowNumber,
                    ProductCode = row.ProductCode,
                    ProductName = row.ProductName,
                    CategoryName = row.CategoryName,
                    UnitName = row.UnitName,
                    Price = row.Price,
                    StockQuantity = row.StockQuantity,
                    Description = row.Description,
                    Status = status,
                    Message = messages.Count > 0 ? string.Join(" ", messages) : null,
                });
            }

            return Ok(new
            {
                rows = preview,
                total = preview.Count,
                newCount = preview.Count(r => r.Status == "New"),
                duplicateCount = preview.Count(r => r.Status == "Duplicate"),
                invalidCount = preview.Count(r => r.Status == "Invalid"),
            });
        }

        [HttpPost("import/commit")]
        /// <summary>
        /// Xác nhận lưu các dòng sản phẩm hợp lệ từ file Excel vào cơ sở dữ liệu
        /// </summary>
        public async Task<IActionResult> ImportCommit([FromBody] ProductImportCommitDto dto)
        {
            if (dto.Rows == null || dto.Rows.Count == 0)
                return BadRequest(new { message = "Không có dữ liệu để nhập." });

            var categories = await _context.ProductCategories.ToListAsync();
            var units = await _context.UnitTypes.ToListAsync();
            int created = 0, updated = 0, skipped = 0;

            foreach (var row in dto.Rows)
            {
                if (string.IsNullOrWhiteSpace(row.ProductCode) || string.IsNullOrWhiteSpace(row.ProductName) || row.Price <= 0)
                {
                    skipped++;
                    continue;
                }

                var category = categories.FirstOrDefault(c => c.Name.Equals(row.CategoryName, StringComparison.OrdinalIgnoreCase));
                var unit = units.FirstOrDefault(u => u.Name.Equals(row.UnitName, StringComparison.OrdinalIgnoreCase));

                var existing = await _context.Products.FirstOrDefaultAsync(p => p.ProductCode == row.ProductCode);
                if (existing != null)
                {
                    if (!row.Overwrite) { skipped++; continue; }
                    existing.ProductName = row.ProductName;
                    existing.Category = category?.Name ?? row.CategoryName;
                    existing.CategoryId = category?.Id;
                    existing.Unit = unit?.Name ?? row.UnitName ?? existing.Unit;
                    existing.UnitTypeId = unit?.Id;
                    existing.Price = row.Price;
                    existing.StockQuantity = row.StockQuantity;
                    existing.Description = row.Description;
                    updated++;
                }
                else
                {
                    _context.Products.Add(new Product
                    {
                        ProductCode = row.ProductCode,
                        ProductName = row.ProductName,
                        Category = category?.Name ?? row.CategoryName,
                        CategoryId = category?.Id,
                        Unit = unit?.Name ?? row.UnitName ?? "",
                        UnitTypeId = unit?.Id,
                        Price = row.Price,
                        StockQuantity = row.StockQuantity,
                        Description = row.Description,
                    });
                    created++;
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new
            {
                message = $"Đã thêm mới {created} sản phẩm, cập nhật {updated}, bỏ qua {skipped}.",
                created,
                updated,
                skipped,
            });
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            var products = await _context.Products.ToListAsync();
            var transactions = await _context.StockTransactions.Include(t => t.Product).ToListAsync();

            var categoryStats = products
                .GroupBy(p => p.Category ?? "Khác")
                .Select(g => new { category = g.Key, count = g.Count(), totalValue = g.Sum(p => p.Price * p.StockQuantity) })
                .ToList();

            var recentTransactions = transactions
                .OrderByDescending(t => t.TransactionDate).Take(10)
                .Select(t => new { t.Id, t.Type, t.Quantity, t.UnitPrice, t.Note, t.TransactionDate, productName = t.Product?.ProductName })
                .ToList();

            return Ok(new
            {
                totalProducts = products.Count,
                totalStockValue = products.Sum(p => p.Price * p.StockQuantity),
                totalImported = transactions.Where(t => t.Type == "Import").Sum(t => t.Quantity * t.UnitPrice),
                totalExported = transactions.Where(t => t.Type == "Export").Sum(t => t.Quantity * t.UnitPrice),
                lowStockCount = products.Count(p => p.StockQuantity < 50),
                categoryStats,
                recentTransactions
            });
        }
    }
}
