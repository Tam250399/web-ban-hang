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
        /// Đăng nhập hệ thống và cấp phát cookie xác thực JWT (hỗ trợ bắt buộc 2FA cho Admin)
        /// </summary>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            var result = await _authService.LoginAsync(dto);

            if (!result.Success)
            {
                return Unauthorized(new { message = result.Message });
            }

            // Nếu tài khoản yêu cầu xác thực 2 bước (2FA bắt buộc cho Admin)
            if (result.RequiresTwoFactor)
            {
                return Ok(new
                {
                    requires2Fa = true,
                    tempToken = result.TempToken,
                    twoFactorMethod = result.TwoFactorMethod,
                    emailMasked = result.EmailMasked,
                    message = result.Message
                });
            }

            SetAccessTokenCookie(result.Token!);
            return Ok(new { user = result.User });
        }

        /// <summary>
        /// Đăng nhập hoặc tạo mới tài khoản qua mạng xã hội (Google / Facebook)
        /// </summary>
        [HttpPost("social-login")]
        public async Task<IActionResult> SocialLogin([FromBody] SocialLoginDto dto)
        {
            var result = await _authService.SocialLoginAsync(dto);

            if (!result.Success)
            {
                return BadRequest(new { message = result.Message });
            }

            // Nếu tài khoản là Admin, bắt buộc xác thực 2 bước (2FA)
            if (result.RequiresTwoFactor)
            {
                return Ok(new
                {
                    requires2Fa = true,
                    tempToken = result.TempToken,
                    twoFactorMethod = result.TwoFactorMethod,
                    emailMasked = result.EmailMasked,
                    message = result.Message
                });
            }

            SetAccessTokenCookie(result.Token!);
            return Ok(new { user = result.User });
        }

        /// <summary>
        /// Xác thực mã OTP 2FA cho tài khoản Quản trị và hoàn tất đăng nhập
        /// </summary>
        [HttpPost("verify-2fa")]
        public async Task<IActionResult> VerifyTwoFactor([FromBody] VerifyTwoFactorDto dto)
        {
            var result = await _authService.VerifyTwoFactorAsync(dto);

            if (!result.Success)
            {
                return Unauthorized(new { message = result.Message });
            }

            SetAccessTokenCookie(result.Token!);
            return Ok(new { user = result.User });
        }

        /// <summary>
        /// Yêu cầu gửi lại mã OTP 2FA qua email
        /// </summary>
        [HttpPost("resend-2fa")]
        public async Task<IActionResult> ResendTwoFactor([FromBody] ResendTwoFactorDto dto)
        {
            var (success, message, maskedEmail) = await _authService.ResendTwoFactorOtpAsync(dto.TempToken);

            if (!success)
            {
                return BadRequest(new { message, emailMasked = maskedEmail });
            }

            return Ok(new { message, emailMasked = maskedEmail });
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

        private void SetAccessTokenCookie(string token)
        {
            Response.Cookies.Append(CookieName, token, new CookieOptions
            {
                HttpOnly = true,
                Secure = !_env.IsDevelopment(),
                SameSite = SameSiteMode.Lax,
                Path = "/",
                Expires = DateTimeOffset.UtcNow.AddDays(7),
            });
        }
    }
}
