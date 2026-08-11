using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SalesManagerBE.Data;
using SalesManagerBE.Models;
using SalesManagerBE.Models.Dtos;

namespace SalesManagerBE.Services
{
    public class AuthService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<AuthResult> RegisterAsync(RegisterDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Username) || string.IsNullOrWhiteSpace(dto.Password))
            {
                return new AuthResult(false, null, "Tên đăng nhập và mật khẩu là bắt buộc.");
            }

            var exists = await _context.Users.AnyAsync(u => u.Username == dto.Username);
            if (exists)
            {
                return new AuthResult(false, null, "Tên đăng nhập đã tồn tại.");
            }

            var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Customer") ?? await _context.Roles.FirstAsync();

            var user = new User
            {
                Username = dto.Username,
                PasswordHash = HashPassword(dto.Password),
                FullName = dto.FullName,
                Email = dto.Email,
                PhoneNumber = dto.PhoneNumber,
                RoleId = role.Id
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            return new AuthResult(true, new UserInfo(user.Id, user.Username, user.FullName), null);
        }

        public async Task<AuthResult> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Username == dto.Username);
            if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
            {
                return new AuthResult(false, null, "Tên đăng nhập hoặc mật khẩu không đúng.");
            }

            var token = GenerateJwtToken(user);
            return new AuthResult(true, new UserInfo(user.Id, user.Username, user.FullName, user.Role?.RoleName), null, token);
        }

        private string GenerateJwtToken(User user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Key"] ?? "Key_Bi_Mat_Sieu_Cap_Vu_Tru_2026_This_Is_A_Very_Long_Key");
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, user.Role?.RoleName ?? "Customer")
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        public static string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToHexString(bytes);
        }

        private static bool VerifyPassword(string password, string storedHash)
        {
            return string.Equals(HashPassword(password), storedHash, StringComparison.OrdinalIgnoreCase);
        }
    }

    public class AuthResult
    {
        public AuthResult(bool success, UserInfo? user, string? message, string? token = null)
        {
            Success = success;
            User = user;
            Message = message;
            Token = token;
        }

        public bool Success { get; set; }
        public UserInfo? User { get; set; }
        public string? Message { get; set; }
        public string? Token { get; set; }
    }

    public class UserInfo
    {
        public UserInfo(int id, string username, string? fullName, string? role = null)
        {
            Id = id;
            Username = username;
            FullName = fullName;
            Role = role;
        }

        public int Id { get; set; }
        public string Username { get; set; }
        public string? FullName { get; set; }
        public string? Role { get; set; }
    }
}
