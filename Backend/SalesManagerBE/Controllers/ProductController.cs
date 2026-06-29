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

        public ProductController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var products = await _context.Products.OrderBy(p => p.Category).ThenBy(p => p.ProductName).ToListAsync();
            return Ok(products);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null) return NotFound();
            return Ok(product);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateProductDto dto)
        {
            var exists = await _context.Products.AnyAsync(p => p.ProductCode == dto.ProductCode);
            if (exists) return BadRequest(new { message = "Mã sản phẩm đã tồn tại." });

            var product = new Product
            {
                ProductCode = dto.ProductCode,
                ProductName = dto.ProductName,
                Unit = dto.Unit,
                Price = dto.Price,
                StockQuantity = dto.StockQuantity,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                Category = dto.Category
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

            product.ProductName = dto.ProductName;
            product.Unit = dto.Unit;
            product.Price = dto.Price;
            product.Description = dto.Description;
            product.ImageUrl = dto.ImageUrl;
            product.Category = dto.Category;

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

            var totalProducts = products.Count;
            var totalStockValue = products.Sum(p => p.Price * p.StockQuantity);
            var lowStockProducts = products.Where(p => p.StockQuantity < 50).ToList();

            var totalImported = transactions.Where(t => t.Type == "Import").Sum(t => t.Quantity * t.UnitPrice);
            var totalExported = transactions.Where(t => t.Type == "Export").Sum(t => t.Quantity * t.UnitPrice);

            var categoryStats = products
                .GroupBy(p => p.Category ?? "Khác")
                .Select(g => new { category = g.Key, count = g.Count(), totalValue = g.Sum(p => p.Price * p.StockQuantity) })
                .ToList();

            var recentTransactions = transactions
                .OrderByDescending(t => t.TransactionDate)
                .Take(10)
                .Select(t => new {
                    t.Id, t.Type, t.Quantity, t.UnitPrice, t.Note, t.TransactionDate,
                    productName = t.Product?.ProductName
                })
                .ToList();

            return Ok(new
            {
                totalProducts,
                totalStockValue,
                totalImported,
                totalExported,
                lowStockCount = lowStockProducts.Count,
                categoryStats,
                recentTransactions
            });
        }
    }
}
