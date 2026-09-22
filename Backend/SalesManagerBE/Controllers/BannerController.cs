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
    public class BannerController : ControllerBase
    {
        private readonly AppDbContext _context;
        public BannerController(AppDbContext context) { _context = context; }

        /// <summary>
        /// Lấy danh sách banner đang hoạt động để hiển thị ở trang chủ
        /// </summary>
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetActive() =>
            Ok(await _context.Banners
                .Where(b => b.IsActive)
                .OrderBy(b => b.DisplayOrder)
                .ToListAsync());

        /// <summary>
        /// Lấy tất cả banner phục vụ quản lý (Admin/Staff)
        /// </summary>
        [HttpGet("all")]
        public async Task<IActionResult> GetAll() =>
            Ok(await _context.Banners
                .OrderByDescending(b => b.CreatedAt)
                .ThenByDescending(b => b.Id)
                .ToListAsync());

        /// <summary>
        /// Tạo mới một banner quảng cáo
        /// </summary>
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

        /// <summary>
        /// Cập nhật thông tin banner theo ID
        /// </summary>
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
            entity.CreatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        /// <summary>
        /// Xóa banner theo ID
        /// </summary>
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
