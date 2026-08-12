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

            return new AuthResult(true, new UserInfo(user.Id, user.Username, user.FullName, phoneNumber: user.PhoneNumber), null);
        }

        public async Task<AuthResult> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Username == dto.Username);
            if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
            {
                return new AuthResult(false, null, "Tên đăng nhập hoặc mật khẩu không đúng.");
            }

            var token = GenerateJwtToken(user);
            return new AuthResult(true, new UserInfo(user.Id, user.Username, user.FullName, user.Role?.RoleName, user.PhoneNumber), null, token);
        }

        private string GenerateJwtToken(User user)
        {
            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(jwtKey))
                throw new InvalidOperationException("Jwt:Key chưa được cấu hình.");

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(jwtKey);
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Name, user.Username),
                    new Claim(ClaimTypes.Role, user.Role?.RoleName ?? "Customer")
                }),
                Issuer = _configuration["Jwt:Issuer"] ?? "SalesManagerBE",
                Audience = _configuration["Jwt:Audience"] ?? "SalesManagerFE",
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        // Định dạng lưu trữ: {số vòng lặp}.{salt base64}.{hash base64} — PBKDF2/HMAC-SHA256 với salt ngẫu nhiên theo từng user.
        private const int Pbkdf2Iterations = 100_000;
        private const int Pbkdf2SaltSize = 16;
        private const int Pbkdf2HashSize = 32;

        public static string HashPassword(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(Pbkdf2SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, Pbkdf2Iterations, HashAlgorithmName.SHA256, Pbkdf2HashSize);
            return $"{Pbkdf2Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
        }

        private static bool VerifyPassword(string password, string storedHash)
        {
            var parts = storedHash.Split('.');
            if (parts.Length != 3 || !int.TryParse(parts[0], out var iterations))
                return false;

            byte[] salt, expectedHash;
            try
            {
                salt = Convert.FromBase64String(parts[1]);
                expectedHash = Convert.FromBase64String(parts[2]);
            }
            catch (FormatException)
            {
                return false;
            }

            var actualHash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, iterations, HashAlgorithmName.SHA256, expectedHash.Length);
            return CryptographicOperations.FixedTimeEquals(actualHash, expectedHash);
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
        public UserInfo(int id, string username, string? fullName, string? role = null, string? phoneNumber = null)
        {
            Id = id;
            Username = username;
            FullName = fullName;
            Role = role;
            PhoneNumber = phoneNumber;
        }

        public int Id { get; set; }
        public string Username { get; set; }
        public string? FullName { get; set; }
        public string? Role { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
