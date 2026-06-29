using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Data;
using SalesManagerBE.Models;
using SalesManagerBE.Models.Dtos;

namespace SalesManagerBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StockController : ControllerBase
    {
        private readonly AppDbContext _context;

        public StockController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var transactions = await _context.StockTransactions
                .Include(t => t.Product)
                .OrderByDescending(t => t.TransactionDate)
                .Select(t => new {
                    t.Id, t.ProductId, t.Type, t.Quantity, t.UnitPrice, t.Note, t.TransactionDate,
                    productName = t.Product!.ProductName,
                    productCode = t.Product.ProductCode
                })
                .ToListAsync();
            return Ok(transactions);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] StockTransactionDto dto)
        {
            var product = await _context.Products.FindAsync(dto.ProductId);
            if (product == null) return NotFound(new { message = "Sản phẩm không tồn tại." });

            if (dto.Type == "Export" && product.StockQuantity < dto.Quantity)
                return BadRequest(new { message = "Số lượng tồn kho không đủ." });

            if (dto.Type == "Import")
                product.StockQuantity += dto.Quantity;
            else
                product.StockQuantity -= dto.Quantity;

            var transaction = new StockTransaction
            {
                ProductId = dto.ProductId,
                Type = dto.Type,
                Quantity = dto.Quantity,
                UnitPrice = dto.UnitPrice,
                Note = dto.Note
            };

            _context.StockTransactions.Add(transaction);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Giao dịch thành công.", transaction, updatedStock = product.StockQuantity });
        }
    }
}
