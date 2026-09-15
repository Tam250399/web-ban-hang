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
    public class StockController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IStockExcelService _excelService;

        public StockController(AppDbContext context, IStockExcelService excelService)
        {
            _context = context;
            _excelService = excelService;
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

        [HttpGet("import-template")]
        /// <summary>
        /// Tải về file mẫu Excel để nhập kho hàng loạt
        /// </summary>
        public async Task<IActionResult> ImportTemplate()
        {
            var products = await _context.Products.OrderBy(p => p.ProductCode).ToListAsync();
            var bytes = _excelService.GenerateImportTemplate(products);
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "MauNhapKho.xlsx");
        }

        [HttpPost("import/preview")]
        /// <summary>
        /// Xem trước và kiểm tra file Excel nhập kho hàng loạt
        /// </summary>
        public async Task<IActionResult> ImportPreview(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn file." });

            List<StockImportRawRow> rawRows;
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

            var products = await _context.Products.ToListAsync();
            var preview = new List<StockImportPreviewRowDto>();

            foreach (var row in rawRows)
            {
                var messages = new List<string>();
                var product = products.FirstOrDefault(p => p.ProductCode.Equals(row.ProductCode, StringComparison.OrdinalIgnoreCase));

                if (string.IsNullOrWhiteSpace(row.ProductCode)) messages.Add("Thiếu mã sản phẩm.");
                else if (product == null) messages.Add($"Không tìm thấy sản phẩm mã \"{row.ProductCode}\".");
                if (row.Quantity <= 0) messages.Add("Số lượng phải lớn hơn 0.");
                if (row.UnitPrice < 0) messages.Add("Đơn giá không hợp lệ.");

                preview.Add(new StockImportPreviewRowDto
                {
                    RowNumber = row.RowNumber,
                    ProductCode = row.ProductCode,
                    ProductName = product?.ProductName,
                    ProductId = product?.Id,
                    Quantity = row.Quantity,
                    UnitPrice = row.UnitPrice,
                    Note = row.Note,
                    Status = messages.Count > 0 ? "Invalid" : "Valid",
                    Message = messages.Count > 0 ? string.Join(" ", messages) : null,
                });
            }

            return Ok(new
            {
                rows = preview,
                total = preview.Count,
                validCount = preview.Count(r => r.Status == "Valid"),
                invalidCount = preview.Count(r => r.Status == "Invalid"),
            });
        }

        [HttpPost("import/commit")]
        /// <summary>
        /// Xác nhận lưu các dòng nhập kho từ file Excel vào hệ thống
        /// </summary>
        public async Task<IActionResult> ImportCommit([FromBody] StockImportCommitDto dto)
        {
            if (dto.Rows == null || dto.Rows.Count == 0)
                return BadRequest(new { message = "Không có dữ liệu để nhập." });

            var productIds = dto.Rows.Select(r => r.ProductId).Distinct().ToList();
            var products = await _context.Products.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

            int created = 0, skipped = 0;
            foreach (var row in dto.Rows)
            {
                if (row.Quantity <= 0 || !products.TryGetValue(row.ProductId, out var product))
                {
                    skipped++;
                    continue;
                }

                product.StockQuantity += row.Quantity;
                _context.StockTransactions.Add(new StockTransaction
                {
                    ProductId = row.ProductId,
                    Type = "Import",
                    Quantity = row.Quantity,
                    UnitPrice = row.UnitPrice,
                    Note = row.Note,
                });
                created++;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = $"Đã nhập kho {created} dòng, bỏ qua {skipped}.", created, skipped });
        }
    }
}
