using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Data;
using SalesManagerBE.Models;
using SalesManagerBE.Models.Dtos;

namespace SalesManagerBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ProductController(AppDbContext context) { _context = context; }

        [HttpGet]
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
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _context.Products.Include(p => p.ProductCategory).Include(p => p.UnitType).FirstOrDefaultAsync(p => p.Id == id);
            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
        {
            if (await _context.Products.AnyAsync(p => p.ProductCode == dto.ProductCode))
                return BadRequest(new { message = "Mã sản phẩm đã tồn tại." });

            // Lấy tên danh mục từ CategoryId nếu có
            string? categoryName = dto.Category;
            if (dto.CategoryId.HasValue)
            {
                var cat = await _context.ProductCategories.FindAsync(dto.CategoryId.Value);
                categoryName = cat?.Name ?? dto.Category;
            }

            // Lấy tên đơn vị từ UnitTypeId nếu có
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
            return Ok(product);
        }

        [HttpPut("{id}")]
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
            return Ok(product);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();
            _context.Products.Remove(product);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa sản phẩm." });
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
