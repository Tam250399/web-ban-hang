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

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] StockTransactionDto dto)
        {
            var transaction = await _context.StockTransactions.FindAsync(id);
            if (transaction == null) return NotFound(new { message = "Không tìm thấy giao dịch." });
            if (transaction.SalesInvoiceId != null)
                return BadRequest(new { message = "Giao dịch này thuộc phiếu bán hàng, vui lòng chỉnh sửa qua Xuất kho." });

            var newProduct = await _context.Products.FindAsync(dto.ProductId);
            if (newProduct == null) return NotFound(new { message = "Sản phẩm không tồn tại." });

            // Hoàn tác ảnh hưởng tồn kho của giao dịch cũ trước khi áp dụng giá trị mới.
            var oldProduct = transaction.ProductId == dto.ProductId
                ? newProduct
                : await _context.Products.FindAsync(transaction.ProductId);
            if (oldProduct != null)
            {
                if (transaction.Type == "Import") oldProduct.StockQuantity -= transaction.Quantity;
                else oldProduct.StockQuantity += transaction.Quantity;
            }

            if (dto.Type == "Export" && newProduct.StockQuantity < dto.Quantity)
                return BadRequest(new { message = "Số lượng tồn kho không đủ." });

            if (dto.Type == "Import") newProduct.StockQuantity += dto.Quantity;
            else newProduct.StockQuantity -= dto.Quantity;

            transaction.ProductId = dto.ProductId;
            transaction.Type = dto.Type;
            transaction.Quantity = dto.Quantity;
            transaction.UnitPrice = dto.UnitPrice;
            transaction.Note = dto.Note;

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật giao dịch thành công.", transaction, updatedStock = newProduct.StockQuantity });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var transaction = await _context.StockTransactions.FindAsync(id);
            if (transaction == null) return NotFound(new { message = "Không tìm thấy giao dịch." });
            if (transaction.SalesInvoiceId != null)
                return BadRequest(new { message = "Giao dịch này thuộc phiếu bán hàng, vui lòng xóa qua Xuất kho." });

            var product = await _context.Products.FindAsync(transaction.ProductId);
            if (product != null)
            {
                if (transaction.Type == "Import") product.StockQuantity -= transaction.Quantity;
                else product.StockQuantity += transaction.Quantity;
            }

            _context.StockTransactions.Remove(transaction);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa giao dịch." });
        }
    }
}
