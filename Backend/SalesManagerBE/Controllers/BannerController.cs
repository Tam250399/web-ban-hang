using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Data;
using SalesManagerBE.Models;
using SalesManagerBE.Models.Dtos;

namespace SalesManagerBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BannerController : ControllerBase
    {
        private readonly AppDbContext _context;
        public BannerController(AppDbContext context) { _context = context; }

        // Dùng cho trang chủ — chỉ lấy banner đang bật, sắp theo thứ tự hiển thị
        [HttpGet]
        public async Task<IActionResult> GetActive() =>
            Ok(await _context.Banners
                .Where(b => b.IsActive)
                .OrderBy(b => b.DisplayOrder)
                .ToListAsync());

        // Dùng cho trang quản trị — lấy tất cả
        [HttpGet("all")]
        public async Task<IActionResult> GetAll() =>
            Ok(await _context.Banners
                .OrderBy(b => b.DisplayOrder)
                .ToListAsync());

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] BannerDto dto)
        {
            var entity = new Banner
            {
                Title = dto.Title,
                Description = dto.Description,
                ImageUrl = dto.ImageUrl,
                DisplayOrder = dto.DisplayOrder,
                IsActive = dto.IsActive,
            };
            _context.Banners.Add(entity);
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] BannerDto dto)
        {
            var entity = await _context.Banners.FindAsync(id);
            if (entity == null) return NotFound();
            entity.Title = dto.Title;
            entity.Description = dto.Description;
            entity.ImageUrl = dto.ImageUrl;
            entity.DisplayOrder = dto.DisplayOrder;
            entity.IsActive = dto.IsActive;
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var entity = await _context.Banners.FindAsync(id);
            if (entity == null) return NotFound();
            _context.Banners.Remove(entity);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa banner." });
        }
    }
}
