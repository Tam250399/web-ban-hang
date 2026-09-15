using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Data;

namespace SalesManagerBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")]
    public class RoleController : ControllerBase
    {
        private readonly AppDbContext _context;
        public RoleController(AppDbContext context) { _context = context; }

        [HttpGet]
        /// <summary>
        /// Lấy danh sách các vai trò (roles) trong hệ thống
        /// </summary>
        public async Task<IActionResult> GetRoles() =>
            Ok(await _context.Roles.OrderBy(r => r.Id).ToListAsync());
    }
}
