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
    public class CategoryController : ControllerBase
    {
        private readonly AppDbContext _context;
        public CategoryController(AppDbContext context) { _context = context; }

        [HttpGet("product-categories")]
        public async Task<IActionResult> GetProductCategories() =>
            Ok(await _context.ProductCategories.OrderBy(c => c.Name).ToListAsync());

        [HttpGet("product-categories/home")]
        [AllowAnonymous]
        public async Task<IActionResult> GetHomeProductCategories() =>
            Ok(await _context.ProductCategories
                .Where(c => c.ShowOnHome)
                .OrderBy(c => c.Name)
                .ToListAsync());

        [HttpPost("product-categories")]
        public async Task<IActionResult> CreateProductCategory([FromBody] CategoryDto dto)
        {
            if (await _context.ProductCategories.AnyAsync(c => c.Name == dto.Name))
                return BadRequest(new { message = "Danh mục đã tồn tại." });
            var entity = new ProductCategory { Name = dto.Name, Description = dto.Description, ShowOnHome = dto.ShowOnHome };
            _context.ProductCategories.Add(entity);
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpPut("product-categories/{id}")]
        public async Task<IActionResult> UpdateProductCategory(int id, [FromBody] CategoryDto dto)
        {
            var entity = await _context.ProductCategories.FindAsync(id);
            if (entity == null) return NotFound();
            entity.Name = dto.Name;
            entity.Description = dto.Description;
            entity.ShowOnHome = dto.ShowOnHome;
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpDelete("product-categories/{id}")]
        public async Task<IActionResult> DeleteProductCategory(int id)
        {
            var entity = await _context.ProductCategories.FindAsync(id);
            if (entity == null) return NotFound();
            _context.ProductCategories.Remove(entity);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa danh mục." });
        }

        [HttpGet("unit-types")]
        public async Task<IActionResult> GetUnitTypes() =>
            Ok(await _context.UnitTypes.OrderBy(u => u.Name).ToListAsync());

        [HttpPost("unit-types")]
        public async Task<IActionResult> CreateUnitType([FromBody] CategoryDto dto)
        {
            if (await _context.UnitTypes.AnyAsync(u => u.Name == dto.Name))
                return BadRequest(new { message = "Đơn vị đã tồn tại." });
            var entity = new UnitType { Name = dto.Name, Description = dto.Description };
            _context.UnitTypes.Add(entity);
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpPut("unit-types/{id}")]
        public async Task<IActionResult> UpdateUnitType(int id, [FromBody] CategoryDto dto)
        {
            var entity = await _context.UnitTypes.FindAsync(id);
            if (entity == null) return NotFound();
            entity.Name = dto.Name;
            entity.Description = dto.Description;
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpDelete("unit-types/{id}")]
        public async Task<IActionResult> DeleteUnitType(int id)
        {
            var entity = await _context.UnitTypes.FindAsync(id);
            if (entity == null) return NotFound();
            _context.UnitTypes.Remove(entity);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa đơn vị." });
        }

        [HttpGet("product-names")]
        public async Task<IActionResult> GetProductNames() =>
            Ok(await _context.ProductNameTemplates
                .Include(p => p.Category)
                .OrderBy(p => p.CategoryId).ThenBy(p => p.Name)
                .Select(p => new { p.Id, p.Name, p.CategoryId, categoryName = p.Category != null ? p.Category.Name : null })
                .ToListAsync());

        [HttpPost("product-names")]
        public async Task<IActionResult> CreateProductName([FromBody] ProductNameTemplateDto dto)
        {
            var entity = new ProductNameTemplate { Name = dto.Name, CategoryId = dto.CategoryId };
            _context.ProductNameTemplates.Add(entity);
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpPut("product-names/{id}")]
        public async Task<IActionResult> UpdateProductName(int id, [FromBody] ProductNameTemplateDto dto)
        {
            var entity = await _context.ProductNameTemplates.FindAsync(id);
            if (entity == null) return NotFound();
            entity.Name = dto.Name;
            entity.CategoryId = dto.CategoryId;
            await _context.SaveChangesAsync();
            return Ok(entity);
        }

        [HttpDelete("product-names/{id}")]
        public async Task<IActionResult> DeleteProductName(int id)
        {
            var entity = await _context.ProductNameTemplates.FindAsync(id);
            if (entity == null) return NotFound();
            _context.ProductNameTemplates.Remove(entity);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Đã xóa tên sản phẩm." });
        }
    }
}
