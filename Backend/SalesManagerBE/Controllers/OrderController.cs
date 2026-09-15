using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Data;
using SalesManagerBE.Hubs;
using SalesManagerBE.Models;
using SalesManagerBE.Models.Dtos;
using SalesManagerBE.Extensions;

namespace SalesManagerBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrderController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IHubContext<ChatHub> _hub;

                /// <summary>
        /// Lấy họ tên hiển thị của người dùng/nhân viên hiện tại
        /// </summary>
        private async Task<string> GetPreparedByNameAsync()
        {
            var userId = User.GetUserId();
            if (userId is null) return User.GetUsername() ?? "";

            var user = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == userId)
                .Select(u => new { u.FullName, u.Username })
                .FirstOrDefaultAsync();

            if (user is null) return User.GetUsername() ?? "";
            return string.IsNullOrWhiteSpace(user.FullName) ? user.Username : user.FullName;
        }

        public OrderController(AppDbContext context, IHubContext<ChatHub> hub)
        {
            _context = context;
            _hub = hub;
        }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private bool IsStaff => User.IsInRole("Admin") || User.IsInRole("Staff");

        [HttpPost]
        /// <summary>
        /// Khách hàng tạo mới một đơn đặt hàng
        /// </summary>
        public async Task<IActionResult> Create([FromBody] CreateOrderDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.RecipientName))
                return BadRequest(new { message = "Vui lòng nhập tên người nhận." });
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
                return BadRequest(new { message = "Vui lòng nhập số điện thoại." });
            if (dto.Items == null || dto.Items.Count == 0)
                return BadRequest(new { message = "Giỏ hàng trống." });

            var productIds = dto.Items.Select(i => i.ProductId).Distinct().ToList();
            var products = await _context.Products.Where(p => productIds.Contains(p.Id)).ToDictionaryAsync(p => p.Id);

            var order = new Order
            {
                UserId = CurrentUserId,
                RecipientName = dto.RecipientName.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Address = dto.Address?.Trim(),
                Note = dto.Note?.Trim(),
                Status = "Pending",
            };

            foreach (var item in dto.Items)
            {
                if (!products.TryGetValue(item.ProductId, out var product))
                    return BadRequest(new { message = $"Sản phẩm ID {item.ProductId} không tồn tại." });
                if (item.Quantity <= 0)
                    return BadRequest(new { message = $"Số lượng \"{product.ProductName}\" phải lớn hơn 0." });
                if (product.StockQuantity < item.Quantity)
                    return BadRequest(new { message = $"Sản phẩm \"{product.ProductName}\" không đủ tồn kho (còn {product.StockQuantity})." });

                order.Items.Add(new OrderItem
                {
                    ProductId = product.Id,
                    ProductName = product.ProductName,
                    Quantity = item.Quantity,
                    UnitPrice = product.Price,
                });
            }

            _context.Orders.Add(order);
            await _context.SaveChangesAsync();

            await _hub.Clients.Group(ChatHub.AdminsGroup).SendAsync("NewOrder", new
            {
                order.Id,
                order.RecipientName,
                order.PhoneNumber,
                total = order.Items.Sum(i => i.Quantity * i.UnitPrice),
                order.CreatedAt,
            });

            return Ok(new { message = "Đặt hàng thành công! Chúng tôi sẽ liên hệ xác nhận sớm.", orderId = order.Id });
        }

        [HttpGet("mine")]
        public async Task<IActionResult> GetMine()
        {
            var userId = CurrentUserId;
            var orders = await _context.Orders
                .Where(o => o.UserId == userId)
                .Include(o => o.Items)
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    o.Id,
                    o.Status,
                    o.RecipientName,
                    o.PhoneNumber,
                    o.Address,
                    o.Note,
                    o.CancelReason,
                    o.CreatedAt,
                    o.ConfirmedAt,
                    o.SalesInvoiceId,
                    total = o.Items.Sum(i => i.Quantity * i.UnitPrice),
                    items = o.Items.Select(i => new { i.ProductId, i.ProductName, i.Quantity, i.UnitPrice }),
                })
                .ToListAsync();
            return Ok(orders);
        }

        [HttpGet]
        [Authorize(Roles = "Admin,Staff")]
        /// <summary>
        /// Lấy toàn bộ danh sách đơn hàng cho Admin/Staff (hỗ trợ lọc theo trạng thái)
        /// </summary>
        public async Task<IActionResult> GetAll([FromQuery] string? status)
        {
            var query = _context.Orders.Include(o => o.Items).Include(o => o.User).AsQueryable();
            if (!string.IsNullOrWhiteSpace(status))
                query = query.Where(o => o.Status == status);

            var orders = await query
                .OrderByDescending(o => o.CreatedAt)
                .Select(o => new
                {
                    o.Id,
                    o.Status,
                    o.RecipientName,
                    o.PhoneNumber,
                    o.Address,
                    o.Note,
                    o.CancelReason,
                    o.CreatedAt,
                    o.ConfirmedAt,
                    o.SalesInvoiceId,
                    customerUsername = o.User != null ? o.User.Username : null,
                    itemCount = o.Items.Count,
                    total = o.Items.Sum(i => i.Quantity * i.UnitPrice),
                })
                .ToListAsync();
            return Ok(orders);
        }

        [HttpGet("{id:int}")]
        /// <summary>
        /// Lấy thông tin chi tiết của một đơn hàng theo ID
        /// </summary>
        public async Task<IActionResult> GetById(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Items)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });
            if (order.UserId != CurrentUserId && !IsStaff) return Forbid();

            return Ok(new
            {
                order.Id,
                order.Status,
                order.RecipientName,
                order.PhoneNumber,
                order.Address,
                order.Note,
                order.CancelReason,
                order.CreatedAt,
                order.ConfirmedAt,
                order.SalesInvoiceId,
                total = order.Items.Sum(i => i.Quantity * i.UnitPrice),
                items = order.Items.Select(i => new { i.ProductId, i.ProductName, i.Quantity, i.UnitPrice }),
            });
        }

        [HttpPost("{id:int}/confirm")]
        [Authorize(Roles = "Admin,Staff")]
        /// <summary>
        /// Nhân viên xác nhận đơn hàng: kiểm tra tồn kho, trừ kho và tự động lập phiếu bán hàng
        /// </summary>
        public async Task<IActionResult> Confirm(int id, [FromBody] ConfirmOrderDto? dto)
        {
            var order = await _context.Orders
                .Include(o => o.Items).ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });
            if (order.Status != "Pending")
                return BadRequest(new { message = "Đơn hàng này đã được xử lý." });

            foreach (var item in order.Items)
            {
                if (item.Product == null)
                    return BadRequest(new { message = $"Sản phẩm \"{item.ProductName}\" không còn tồn tại." });
                if (item.Product.StockQuantity < item.Quantity)
                    return BadRequest(new { message = $"Sản phẩm \"{item.ProductName}\" không đủ tồn kho (còn {item.Product.StockQuantity}, cần {item.Quantity})." });
            }

            var customer = await _context.Customers.FirstOrDefaultAsync(c => c.PhoneNumber == order.PhoneNumber);
            if (customer == null)
            {
                customer = new Customer
                {
                    FullName = order.RecipientName,
                    PhoneNumber = order.PhoneNumber,
                    Address = order.Address,
                };
                _context.Customers.Add(customer);
            }

            var invoice = new SalesInvoice
            {
                Customer = customer,
                CustomerName = customer.FullName,
                InvoiceDate = DateTime.UtcNow,
                PreparedByName = await GetPreparedByNameAsync(),
            };

            foreach (var item in order.Items)
            {
                item.Product!.StockQuantity -= item.Quantity;
                invoice.Items.Add(new StockTransaction
                {
                    ProductId = item.ProductId,
                    Type = "Export",
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    TransactionDate = DateTime.UtcNow,
                    Note = $"Đơn hàng online #{order.Id} - {customer.FullName}",
                });
            }

            _context.SalesInvoices.Add(invoice);
            order.Status = "Confirmed";
            order.ConfirmedAt = DateTime.UtcNow;
            order.SalesInvoice = invoice;

            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã xác nhận đơn hàng và tạo phiếu bán hàng.", invoiceId = invoice.Id });
        }

        [HttpPost("{id:int}/reorder")]
        /// <summary>
        /// Đặt lại đơn hàng đã hủy: cập nhật lại đơn về trạng thái Pending theo giá sản phẩm mới nhất
        /// </summary>
        public async Task<IActionResult> Reorder(int id)
        {
            var order = await _context.Orders
                .Include(o => o.Items).ThenInclude(i => i.Product)
                .FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });
            if (order.UserId != CurrentUserId) return Forbid();
            if (order.Status != "Cancelled")
                return BadRequest(new { message = "Chỉ có thể đặt lại đơn đã huỷ." });

            var unavailable = new List<string>();
            var toRemove = new List<OrderItem>();
            foreach (var item in order.Items)
            {
                if (item.Product == null || item.Product.StockQuantity <= 0)
                {
                    unavailable.Add(item.ProductName);
                    toRemove.Add(item);
                    continue;
                }
                item.Quantity = Math.Min(item.Quantity, item.Product.StockQuantity);
                item.UnitPrice = item.Product.Price;
            }

            foreach (var item in toRemove)
            {
                order.Items.Remove(item);
                _context.OrderItems.Remove(item);
            }

            if (order.Items.Count == 0)
                return BadRequest(new { message = "Các sản phẩm trong đơn này hiện đã hết hàng, không thể đặt lại." });

            order.Status = "Pending";
            order.CancelReason = null;
            order.ConfirmedAt = null;
            order.CreatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            var message = unavailable.Count > 0
                ? $"Đã đặt lại đơn hàng. Đã bỏ {unavailable.Count} sản phẩm hết hàng: {string.Join(", ", unavailable)}."
                : "Đã đặt lại đơn hàng.";
            return Ok(new { message, orderId = order.Id });
        }

        [HttpPost("{id:int}/cancel")]
        public async Task<IActionResult> Cancel(int id, [FromBody] CancelOrderDto? dto)
        {
            var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
            if (order == null) return NotFound(new { message = "Không tìm thấy đơn hàng." });
            if (order.UserId != CurrentUserId && !IsStaff) return Forbid();
            if (order.Status != "Pending")
                return BadRequest(new { message = "Chỉ có thể huỷ đơn đang chờ xử lý." });

            order.Status = "Cancelled";
            order.CancelReason = dto?.Reason;
            await _context.SaveChangesAsync();

            return Ok(new { message = "Đã huỷ đơn hàng." });
        }
    }
}
