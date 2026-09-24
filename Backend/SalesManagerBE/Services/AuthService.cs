using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
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
        private readonly TwoFactorService _twoFactorService;
        private readonly IHttpClientFactory? _httpClientFactory;

        public AuthService(
            AppDbContext context,
            IConfiguration configuration,
            TwoFactorService? twoFactorService = null,
            IHttpClientFactory? httpClientFactory = null)
        {
            _context = context;
            _configuration = configuration;
            _twoFactorService = twoFactorService ?? new TwoFactorService(
                new Microsoft.Extensions.Logging.Abstractions.NullLogger<TwoFactorService>(),
                configuration);
            _httpClientFactory = httpClientFactory;
        }

        /// <summary>
        /// Xử lý đăng ký tài khoản người dùng mới
        /// </summary>
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

        /// <summary>
        /// Xử lý đăng nhập tài khoản và xác thực mật khẩu
        /// </summary>
        public async Task<AuthResult> LoginAsync(LoginDto dto)
        {
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Username == dto.Username);
            if (user == null || !VerifyPassword(dto.Password, user.PasswordHash))
            {
                return new AuthResult(false, null, "Tên đăng nhập hoặc mật khẩu không đúng.");
            }

            // Đối với tài khoản Quản trị (Admin), bắt buộc xác thực 2 bước (2FA) bảo vệ dữ liệu nội bộ
            var isAdmin = string.Equals(user.Role?.RoleName, "Admin", StringComparison.OrdinalIgnoreCase);
            if (isAdmin)
            {
                return await InitiateTwoFactorAsync(user);
            }

            var token = GenerateJwtToken(user);
            return new AuthResult(true, new UserInfo(user.Id, user.Username, user.FullName, user.Role?.RoleName, user.PhoneNumber), null, token);
        }

        /// <summary>
        /// Khởi tạo quá trình xác thực 2 bước (2FA) cho tài khoản Quản trị
        /// </summary>
        public async Task<AuthResult> InitiateTwoFactorAsync(User user)
        {
            var (_, maskedEmail) = await _twoFactorService.GenerateAndSendOtpAsync(user);
            var tempToken = GenerateTemp2FaToken(user);

            return new AuthResult(true, null, "Tài khoản Quản trị yêu cầu xác thực 2 bước (2FA).")
            {
                RequiresTwoFactor = true,
                TempToken = tempToken,
                TwoFactorMethod = "EmailOtp",
                EmailMasked = maskedEmail
            };
        }

        /// <summary>
        /// Xác thực mã OTP 2FA và cấp phát phiên đăng nhập đầy đủ
        /// </summary>
        public async Task<AuthResult> VerifyTwoFactorAsync(VerifyTwoFactorDto dto)
        {
            var userId = ValidateTemp2FaToken(dto.TempToken);
            if (userId == null)
            {
                return new AuthResult(false, null, "Phiên xác thực 2FA đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.");
            }

            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null)
            {
                return new AuthResult(false, null, "Không tìm thấy thông tin tài khoản.");
            }

            var ok = _twoFactorService.VerifyCode(user.Id, dto.Code);
            if (!ok)
            {
                return new AuthResult(false, null, "Mã xác thực OTP không chính xác hoặc đã hết hạn.");
            }

            var token = GenerateJwtToken(user);
            return new AuthResult(true, new UserInfo(user.Id, user.Username, user.FullName, user.Role?.RoleName, user.PhoneNumber), null, token);
        }

        /// <summary>
        /// Gửi lại mã OTP xác thực 2FA cho người dùng
        /// </summary>
        public async Task<(bool Success, string Message, string? MaskedEmail)> ResendTwoFactorOtpAsync(string tempToken)
        {
            var userId = ValidateTemp2FaToken(tempToken);
            if (userId == null)
            {
                return (false, "Phiên xác thực 2FA đã hết hạn. Vui lòng đăng nhập lại.", null);
            }

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId.Value);
            if (user == null)
            {
                return (false, "Không tìm thấy thông tin người dùng.", null);
            }

            var (ok, msg, masked) = await _twoFactorService.ResendOtpAsync(user);
            return (ok, msg, masked);
        }

        /// <summary>
        /// Xử lý đăng nhập thông qua mạng xã hội (Google / Facebook)
        /// </summary>
        public async Task<AuthResult> SocialLoginAsync(SocialLoginDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Provider))
            {
                return new AuthResult(false, null, "Nhà cung cấp đăng nhập không hợp lệ.");
            }

            // 1. Xác thực danh tính với máy chủ Google / Facebook nếu có gửi kèm token
            if (!string.IsNullOrWhiteSpace(dto.Token) && _httpClientFactory != null)
            {
                try
                {
                    var client = _httpClientFactory.CreateClient();
                    if (dto.Provider.Equals("Google", StringComparison.OrdinalIgnoreCase))
                    {
                        HttpResponseMessage? googleResp = null;
                        if (dto.Token.Contains("."))
                        {
                            // ID Token (JWT từ Google Identity Services)
                            googleResp = await client.GetAsync($"https://oauth2.googleapis.com/tokeninfo?id_token={dto.Token}");
                        }
                        else
                        {
                            // Access Token OAuth2
                            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", dto.Token);
                            googleResp = await client.GetAsync("https://www.googleapis.com/oauth2/v3/userinfo");
                        }

                        if (googleResp != null && googleResp.IsSuccessStatusCode)
                        {
                            var json = await googleResp.Content.ReadAsStringAsync();
                            using var doc = JsonDocument.Parse(json);
                            if (doc.RootElement.TryGetProperty("email", out var emailProp))
                                dto.Email = emailProp.GetString();
                            if (doc.RootElement.TryGetProperty("name", out var nameProp))
                                dto.Name = nameProp.GetString();
                            if (doc.RootElement.TryGetProperty("sub", out var subProp))
                                dto.ProviderKey = subProp.GetString();
                        }
                    }
                    else if (dto.Provider.Equals("Facebook", StringComparison.OrdinalIgnoreCase))
                    {
                        var fbResp = await client.GetAsync($"https://graph.facebook.com/me?fields=id,name,email,picture&access_token={dto.Token}");
                        if (fbResp.IsSuccessStatusCode)
                        {
                            var json = await fbResp.Content.ReadAsStringAsync();
                            using var doc = JsonDocument.Parse(json);
                            if (doc.RootElement.TryGetProperty("email", out var emailProp))
                                dto.Email = emailProp.GetString();
                            if (doc.RootElement.TryGetProperty("name", out var nameProp))
                                dto.Name = nameProp.GetString();
                            if (doc.RootElement.TryGetProperty("id", out var idProp))
                                dto.ProviderKey = idProp.GetString();
                        }
                    }
                }
                catch
                {
                    // Fallback theo dto.Email nếu kết nối ngoài bị gián đoạn
                }
            }

            var email = dto.Email?.Trim().ToLowerInvariant();
            var username = !string.IsNullOrWhiteSpace(email)
                ? email
                : $"{dto.Provider.ToLowerInvariant()}_{dto.ProviderKey ?? Guid.NewGuid().ToString("N")[..8]}";

            // Tìm kiếm tài khoản đã tồn tại theo email hoặc username
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u =>
                (!string.IsNullOrWhiteSpace(email) && u.Email == email) || u.Username == username);

            if (user == null)
            {
                // Tự động tạo tài khoản Customer mới cho khách hàng đăng nhập Google/Facebook
                var role = await _context.Roles.FirstOrDefaultAsync(r => r.RoleName == "Customer") ?? await _context.Roles.FirstAsync();
                user = new User
                {
                    Username = username,
                    PasswordHash = HashPassword(Guid.NewGuid().ToString("N")),
                    FullName = !string.IsNullOrWhiteSpace(dto.Name) ? dto.Name : $"{dto.Provider} User",
                    Email = email,
                    RoleId = role.Id
                };
                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                user.Role = role;
            }

            // Nếu tài khoản là Admin, bắt buộc xác thực 2 bước (2FA) bảo vệ dữ liệu nội bộ
            var isAdmin = string.Equals(user.Role?.RoleName, "Admin", StringComparison.OrdinalIgnoreCase);
            if (isAdmin)
            {
                return await InitiateTwoFactorAsync(user);
            }

            var token = GenerateJwtToken(user);
            return new AuthResult(true, new UserInfo(user.Id, user.Username, user.FullName, user.Role?.RoleName, user.PhoneNumber), null, token);
        }

        /// <summary>
        /// Tạo JWT Token tạm thời (10 phút) dùng riêng cho bước xác thực 2FA
        /// </summary>
        private string GenerateTemp2FaToken(User user)
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
                    new Claim("purpose", "2FA")
                }),
                Issuer = _configuration["Jwt:Issuer"] ?? "SalesManagerBE",
                Audience = _configuration["Jwt:Audience"] ?? "SalesManagerFE",
                Expires = DateTime.UtcNow.AddMinutes(10),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }

        /// <summary>
        /// Kiểm tra tính hợp lệ của token tạm thời 2FA và lấy ra UserId
        /// </summary>
        private int? ValidateTemp2FaToken(string tempToken)
        {
            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(jwtKey) || string.IsNullOrWhiteSpace(tempToken)) return null;

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(jwtKey);
            try
            {
                var principal = tokenHandler.ValidateToken(tempToken, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                }, out _);

                var purpose = principal.FindFirst("purpose")?.Value;
                if (purpose != "2FA") return null;

                var idStr = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (int.TryParse(idStr, out var userId)) return userId;
            }
            catch
            {
                return null;
            }
            return null;
        }

        /// <summary>
        /// Tạo JWT token mang định danh và vai trò của người dùng
        /// </summary>
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

        private const int Pbkdf2Iterations = 100_000;
        private const int Pbkdf2SaltSize = 16;
        private const int Pbkdf2HashSize = 32;

        /// <summary>
        /// Băm mật khẩu người dùng với muối ngẫu nhiên bằng thuật toán PBKDF2
        /// </summary>
        public static string HashPassword(string password)
        {
            var salt = RandomNumberGenerator.GetBytes(Pbkdf2SaltSize);
            var hash = Rfc2898DeriveBytes.Pbkdf2(Encoding.UTF8.GetBytes(password), salt, Pbkdf2Iterations, HashAlgorithmName.SHA256, Pbkdf2HashSize);
            return $"{Pbkdf2Iterations}.{Convert.ToBase64String(salt)}.{Convert.ToBase64String(hash)}";
        }

        /// <summary>
        /// Kiểm tra tính khớp nhau của mật khẩu nhập vào với mã băm lưu trong cơ sở dữ liệu
        /// </summary>
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
        public bool RequiresTwoFactor { get; set; }
        public string? TempToken { get; set; }
        public string? TwoFactorMethod { get; set; }
        public string? EmailMasked { get; set; }
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
