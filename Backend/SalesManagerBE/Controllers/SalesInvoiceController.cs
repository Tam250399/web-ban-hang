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
    public class SalesInvoiceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IExcelExportService _excelExportService;

        public SalesInvoiceController(AppDbContext context, IExcelExportService excelExportService)
        {
            _context = context;
            _excelExportService = excelExportService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var invoices = await _context.SalesInvoices
                .Include(i => i.Items)
                .OrderByDescending(i => i.CreatedAt)
                .Select(i => new
                {
                    i.Id,
                    i.CustomerId,
                    i.CustomerName,
                    i.InvoiceDate,
                    i.CreatedAt,
                    itemCount = i.Items.Count,
                    total = i.Items.Sum(t => t.Quantity * t.UnitPrice),
                    fromOrderId = i.Orders.Select(o => (int?)o.Id).FirstOrDefault()
                })
                .ToListAsync();
            return Ok(invoices);
        }

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var invoice = await _context.SalesInvoices
                .Include(i => i.Items).ThenInclude(t => t.Product)
                .FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy phiếu." });
            return Ok(invoice);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateSalesInvoiceDto dto)
        {
            if (dto.CustomerId <= 0)
                return BadRequest(new { message = "Vui lòng chọn khách hàng." });
            var customer = await _context.Customers.FindAsync(dto.CustomerId);
            if (customer == null)
                return NotFound(new { message = "Không tìm thấy khách hàng." });
            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest(new { message = "Phiếu phải có ít nhất 1 sản phẩm." });

            var products = new Dictionary<int, Product>();
            foreach (var item in dto.Items)
            {
                if (products.ContainsKey(item.ProductId)) continue;
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product == null)
                    return NotFound(new { message = $"Sản phẩm ID {item.ProductId} không tồn tại." });
                products[item.ProductId] = product;
            }

            // Gộp số lượng cùng 1 sản phẩm xuất hiện ở nhiều dòng để kiểm tra tồn kho chính xác
            var neededByProduct = dto.Items
                .GroupBy(i => i.ProductId)
                .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));

            foreach (var (productId, needed) in neededByProduct)
            {
                var product = products[productId];
                if (product.StockQuantity < needed)
                    return BadRequest(new { message = $"Sản phẩm \"{product.ProductName}\" không đủ tồn kho (còn {product.StockQuantity}, cần {needed})." });
            }

            var invoiceDateUtc = DateTime.SpecifyKind(dto.InvoiceDate, DateTimeKind.Utc);
            var customerName = customer.FullName;
            var invoice = new SalesInvoice
            {
                CustomerId = customer.Id,
                CustomerName = customerName,
                InvoiceDate = invoiceDateUtc,
                PreparedByName = dto.PreparedByName,
            };

            foreach (var item in dto.Items)
            {
                var product = products[item.ProductId];
                product.StockQuantity -= item.Quantity;
                invoice.Items.Add(new StockTransaction
                {
                    ProductId = item.ProductId,
                    Type = "Export",
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TransactionDate = invoiceDateUtc,
                    Note = $"Phiếu bán hàng - {customerName}"
                });
            }

            _context.SalesInvoices.Add(invoice);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Tạo phiếu bán hàng thành công.", invoiceId = invoice.Id });
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CreateSalesInvoiceDto dto)
        {
            if (dto.CustomerId <= 0)
                return BadRequest(new { message = "Vui lòng chọn khách hàng." });
            var customer = await _context.Customers.FindAsync(dto.CustomerId);
            if (customer == null)
                return NotFound(new { message = "Không tìm thấy khách hàng." });
            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest(new { message = "Phiếu phải có ít nhất 1 sản phẩm." });

            var invoice = await _context.SalesInvoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy phiếu." });

            var products = new Dictionary<int, Product>();
            async Task<Product?> GetProductAsync(int productId)
            {
                if (products.TryGetValue(productId, out var cached)) return cached;
                var product = await _context.Products.FindAsync(productId);
                if (product != null) products[productId] = product;
                return product;
            }

            // Trả lại tồn kho theo các dòng cũ trước khi tính lại
            foreach (var oldItem in invoice.Items)
            {
                var product = await GetProductAsync(oldItem.ProductId);
                if (product != null) product.StockQuantity += oldItem.Quantity;
            }

            foreach (var item in dto.Items)
            {
                var product = await GetProductAsync(item.ProductId);
                if (product == null)
                    return NotFound(new { message = $"Sản phẩm ID {item.ProductId} không tồn tại." });
            }

            var neededByProduct = dto.Items
                .GroupBy(i => i.ProductId)
                .ToDictionary(g => g.Key, g => g.Sum(i => i.Quantity));

            foreach (var (productId, needed) in neededByProduct)
            {
                var product = products[productId];
                if (product.StockQuantity < needed)
                    return BadRequest(new { message = $"Sản phẩm \"{product.ProductName}\" không đủ tồn kho (còn {product.StockQuantity}, cần {needed})." });
            }

            _context.StockTransactions.RemoveRange(invoice.Items);
            invoice.Items.Clear();

            var invoiceDateUtc = DateTime.SpecifyKind(dto.InvoiceDate, DateTimeKind.Utc);
            var customerName = customer.FullName;
            invoice.CustomerId = customer.Id;
            invoice.CustomerName = customerName;
            invoice.InvoiceDate = invoiceDateUtc;
            invoice.PreparedByName = dto.PreparedByName;

            foreach (var item in dto.Items)
            {
                var product = products[item.ProductId];
                product.StockQuantity -= item.Quantity;
                invoice.Items.Add(new StockTransaction
                {
                    ProductId = item.ProductId,
                    Type = "Export",
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TransactionDate = invoiceDateUtc,
                    Note = $"Phiếu bán hàng - {customerName}"
                });
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật phiếu bán hàng thành công." });
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var invoice = await _context.SalesInvoices
                .Include(i => i.Items)
                .FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy phiếu." });

            foreach (var item in invoice.Items)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null) product.StockQuantity += item.Quantity;
            }

            _context.SalesInvoices.Remove(invoice);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xóa phiếu bán hàng." });
        }

        [HttpGet("{id:int}/export")]
        public async Task<IActionResult> Export(int id)
        {
            var invoice = await _context.SalesInvoices
                .Include(i => i.Items).ThenInclude(t => t.Product)
                .FirstOrDefaultAsync(i => i.Id == id);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy phiếu." });

            var bytes = _excelExportService.ExportSalesInvoice(invoice);
            var fileName = $"PhieuBanHang_{invoice.Id}_{invoice.InvoiceDate:ddMMyyyy}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }

        [HttpGet("export")]
        public async Task<IActionResult> ExportMultiple([FromQuery] string ids, [FromQuery] string? preparedBy)
        {
            if (string.IsNullOrWhiteSpace(ids))
                return BadRequest(new { message = "Vui lòng chọn ít nhất 1 phiếu." });

            var idList = ids.Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(s => int.TryParse(s, out var v) ? v : (int?)null)
                .Where(v => v.HasValue)
                .Select(v => v!.Value)
                .Distinct()
                .ToList();

            if (idList.Count == 0)
                return BadRequest(new { message = "Danh sách phiếu không hợp lệ." });

            var invoices = await _context.SalesInvoices
                .Include(i => i.Items).ThenInclude(t => t.Product)
                .Where(i => idList.Contains(i.Id))
                .ToListAsync();

            if (invoices.Count == 0)
                return NotFound(new { message = "Không tìm thấy phiếu nào." });

            var bytes = _excelExportService.ExportSalesInvoicesMerged(invoices, preparedBy ?? "");
            var customerName = invoices.First().CustomerName?.Trim() ?? "KhachHang";
            // Remove invalid filename characters
            var safeName = string.Join("_", customerName.Split(Path.GetInvalidFileNameChars(), StringSplitOptions.RemoveEmptyEntries));
            var fileName = $"PhieuBanHang_{safeName}.xlsx";
            return File(bytes, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", fileName);
        }
    }
}
