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
    public class ContactController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ContactController(AppDbContext context) { _context = context; }

        // Dùng cho trang chủ — chỉ đúng 1 thông tin liên hệ đang bật hiển thị
        [HttpGet("active")]
        [AllowAnonymous]
        public async Task<IActionResult> GetActive() =>
            Ok(await _context.ContactInfos.FirstOrDefaultAsync(c => c.IsActive));

        // Dùng cho trang quản trị — lấy tất cả
        [HttpGet]
        public async Task<IActionResult> GetAll() =>
            Ok(await _context.ContactInfos.OrderByDescending(c => c.IsActive).ThenBy(c => c.Id).ToListAsync());

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ContactInfoDto dto)
        {
            if (dto.IsActive) await DeactivateAllAsync();
            var entity = new ContactInfo
            {
                Address = dto.Address,
                Phone = dto.Phone,
                Email = dto.Email,
                WorkingHours = dto.WorkingHours,
                IsActive = dto.IsActive,
            };
            _context.ContactInfos.Add(entity);
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] ContactInfoDto dto)
        {
            var entity = await _context.ContactInfos.FindAsync(id);
            if (entity == null) return NotFound();
            if (dto.IsActive) await DeactivateAllAsync();
            entity.Address = dto.Address;
            entity.Phone = dto.Phone;
            entity.Email = dto.Email;
            entity.WorkingHours = dto.WorkingHours;
            entity.IsActive = dto.IsActive;
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.ContactInfos.FindAsync(id);
            if (entity == null) return NotFound();
            _context.ContactInfos.Remove(entity);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa thông tin liên hệ." });
        }

        // Chỉ tối đa 1 bản ghi được bật cùng lúc — tắt hết trước khi bật bản ghi mới
        // (SaveChangesAsync của lệnh gọi sau sẽ lưu cùng lúc, coi như 1 transaction).
        private async Task DeactivateAllAsync()
        {
            var actives = await _context.ContactInfos.Where(c => c.IsActive).ToListAsync();
            foreach (var a in actives) a.IsActive = false;
        }
    }
}
