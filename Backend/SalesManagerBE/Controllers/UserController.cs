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
    [Authorize(Roles = "Admin")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;
        public UserController(AppDbContext context) { _context = context; }

        [HttpGet]
        public async Task<IActionResult> GetUsers() =>
            Ok(await _context.Users
                .Include(u => u.Role)
                .OrderBy(u => u.Username)
                .Select(u => new UserDto
                {
                    Id = u.Id,
                    Username = u.Username,
                    FullName = u.FullName,
                    Email = u.Email,
                    PhoneNumber = u.PhoneNumber,
                    RoleId = u.RoleId,
                    RoleName = u.Role != null ? u.Role.RoleName : null,
                    CreatedAt = u.CreatedAt
                })
                .ToListAsync());

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
                return BadRequest(new { message = "Tên đăng nhập và mật khẩu là bắt buộc." });

            if (await _context.Users.AnyAsync(u => u.Username == dto.Username))
                return BadRequest(new { message = "Tên đăng nhập đã tồn tại." });

            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
                return BadRequest(new { message = "Vai trò không hợp lệ." });

            var user = new User
            {
                Username = dto.Username,
                PasswordHash = AuthService.HashPassword(dto.Password),
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                RoleId = dto.RoleId
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                RoleId = user.RoleId,
                RoleName = role.RoleName,
                CreatedAt = user.CreatedAt
            });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
                return BadRequest(new { message = "Vai trò không hợp lệ." });

            user.FullName = dto.FullName;
            user.Email = dto.Email;
            user.PhoneNumber = dto.PhoneNumber;
            user.RoleId = dto.RoleId;
            if (!string.IsNullOrWhiteSpace(dto.Password))
                user.PasswordHash = AuthService.HashPassword(dto.Password);

            await _context.SaveChangesAsync();

            return Ok(new UserDto
            {
                Id = user.Id,
                Username = user.Username,
                FullName = user.FullName,
                Email = user.Email,
                PhoneNumber = user.PhoneNumber,
                RoleId = user.RoleId,
                RoleName = role.RoleName,
                CreatedAt = user.CreatedAt
            });
        }

        [HttpPut("{id}/role")]
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
                return BadRequest(new { message = "Vai trò không hợp lệ." });

            user.RoleId = dto.RoleId;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật quyền thành công." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            _context.Users.Remove(user);
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException)
            {

                return BadRequest(new { message = "Không thể xóa người dùng này vì còn dữ liệu liên quan (tin nhắn, đơn hàng...)." });
            }
            return Ok(new { message = "Đã xóa người dùng." });
        }
    }
}
