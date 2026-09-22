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
        /// <summary>
        /// Lấy danh sách tất cả tài khoản người dùng trong hệ thống
        /// </summary>
        public async Task<IActionResult> GetUsers() =>
            Ok(await _context.Users
                .Include(u => u.Role)
                .OrderByDescending(u => u.CreatedAt)
                .ThenByDescending(u => u.Id)
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
        /// <summary>
        /// Tạo mới một tài khoản người dùng và phân quyền
        /// </summary>
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
        /// <summary>
        /// Cập nhật thông tin tài khoản và vai trò của người dùng
        /// </summary>
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
            user.CreatedAt = DateTime.UtcNow;
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
        /// <summary>
        /// Cập nhật vai trò phân quyền cho tài khoản
        /// </summary>
        public async Task<IActionResult> UpdateUserRole(int id, [FromBody] UpdateUserRoleDto dto)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return NotFound();

            var role = await _context.Roles.FindAsync(dto.RoleId);
            if (role == null)
                return BadRequest(new { message = "Vai trò không hợp lệ." });

            user.RoleId = dto.RoleId;
            user.CreatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return Ok(new { message = "Cập nhật quyền thành công." });
        }

        [HttpDelete("{id}")]
        /// <summary>
        /// Xóa tài khoản người dùng khỏi hệ thống
        /// </summary>
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
