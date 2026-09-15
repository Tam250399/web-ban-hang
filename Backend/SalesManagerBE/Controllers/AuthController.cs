using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Data;
using SalesManagerBE.Models.Dtos;
using SalesManagerBE.Services;

namespace SalesManagerBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private const string CookieName = "access_token";

        private readonly AuthService _authService;
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _env;

        public AuthController(AuthService authService, AppDbContext context, IWebHostEnvironment env)
        {
            _authService = authService;
            _context = context;
            _env = env;
        }

        /// <summary>
        /// Đăng ký tài khoản người dùng mới
        /// </summary>
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            var result = await _authService.RegisterAsync(dto);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new { message = "Đăng ký tài khoản thành công!", user = result.User });
        }

        /// <summary>
        /// Đăng nhập hệ thống và cấp phát cookie xác thực JWT
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            if (!result.Success)
            {
                return Unauthorized(new { message = result.Message });
            }

            Response.Cookies.Append(CookieName, result.Token!, new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(),
                SameSite = SameSiteMode.Lax,
                Path = "/",
                Expires = DateTimeOffset.UtcNow.AddDays(7),
            });

            return Ok(new { user = result.User });
        }

        /// <summary>
        /// Đăng xuất khỏi hệ thống và xóa cookie JWT
        /// </summary>
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete(CookieName, new CookieOptions { Path = "/" });
            return Ok(new { message = "Đã đăng xuất." });
        }

        /// <summary>
        /// Lấy thông tin tài khoản của người dùng đang đăng nhập
        /// </summary>
        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> Me()
        {
            var userId = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return Unauthorized();

            return Ok(new UserInfo(user.Id, user.Username, user.FullName, user.Role?.RoleName, user.PhoneNumber));
        }
    }
}
