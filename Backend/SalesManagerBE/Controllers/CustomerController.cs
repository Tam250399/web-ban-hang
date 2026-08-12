using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Data;
using SalesManagerBE.Models;
using SalesManagerBE.Models.Dtos;

namespace SalesManagerBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff")]
    public class CustomerController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CustomerController(AppDbContext context) { _context = context; }

        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _context.Customers.OrderBy(c => c.FullName).ToListAsync());

        [HttpGet("{id:int}")]
        public async Task<IActionResult> GetById(int id)
        {
            var entity = await _context.Customers.FindAsync(id);
            if (entity == null) return NotFound(new { message = "Không tìm thấy khách hàng." });
            return Ok(entity);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CustomerDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName))
                return BadRequest(new { message = "Vui lòng nhập họ tên khách hàng." });
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
                return BadRequest(new { message = "Vui lòng nhập số điện thoại." });
            if (await _context.Customers.AnyAsync(c => c.PhoneNumber == dto.PhoneNumber))
                return BadRequest(new { message = "Số điện thoại này đã được sử dụng." });

            var entity = new Customer
            {
                FullName = dto.FullName.Trim(),
                PhoneNumber = dto.PhoneNumber.Trim(),
                Address = dto.Address?.Trim(),
                IsBusiness = dto.IsBusiness,
            };
            _context.Customers.Add(entity);
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CustomerDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.FullName))
                return BadRequest(new { message = "Vui lòng nhập họ tên khách hàng." });
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber))
                return BadRequest(new { message = "Vui lòng nhập số điện thoại." });

            var entity = await _context.Customers.FindAsync(id);
            if (entity == null) return NotFound(new { message = "Không tìm thấy khách hàng." });

            if (await _context.Customers.AnyAsync(c => c.Id != id && c.PhoneNumber == dto.PhoneNumber))
                return BadRequest(new { message = "Số điện thoại này đã được sử dụng." });

            entity.FullName = dto.FullName.Trim();
            entity.PhoneNumber = dto.PhoneNumber.Trim();
            entity.Address = dto.Address?.Trim();
            entity.IsBusiness = dto.IsBusiness;
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.Customers.FindAsync(id);
            if (entity == null) return NotFound(new { message = "Không tìm thấy khách hàng." });

            if (await _context.SalesInvoices.AnyAsync(i => i.CustomerId == id))
                return BadRequest(new { message = "Không thể xóa khách hàng đã có phiếu bán hàng." });

            _context.Customers.Remove(entity);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa khách hàng." });
        }
    }
}
