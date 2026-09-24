using System.Collections.Concurrent;
using System.Net;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using SalesManagerBE.Models;

namespace SalesManagerBE.Services
{
    public class TwoFactorEntry
    {
        public int UserId { get; set; }
        public string Code { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public int FailedAttempts { get; set; }
        public DateTime LastSentAt { get; set; }
        public string Method { get; set; } = "EmailOtp"; // "EmailOtp" | "Authenticator"
        public string? Email { get; set; }
    }

    public class TwoFactorService
    {
        private readonly ILogger<TwoFactorService> _logger;
        private readonly IConfiguration _configuration;
        // Lưu trữ OTP tạm thời theo userId
        private readonly ConcurrentDictionary<int, TwoFactorEntry> _cache = new();

        public TwoFactorService(ILogger<TwoFactorService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Sinh mã OTP mới và gửi tới email của người dùng
        /// </summary>
        public async Task<(string Code, string MaskedEmail)> GenerateAndSendOtpAsync(User user)
        {
            var defaultAdminEmail = _configuration["TwoFactor:AdminEmail"] ?? "tamthanhsk25@gmail.com";
            var email = !string.IsNullOrWhiteSpace(user.Email) ? user.Email : defaultAdminEmail;
            
            // Nếu là tài khoản Admin hoặc email mẫu cũ, hướng tới tamthanhsk25@gmail.com
            if (user.RoleId == 1 || string.Equals(user.Username, "admin", StringComparison.OrdinalIgnoreCase) || email.Contains("vlxdlysau.vn"))
            {
                email = defaultAdminEmail;
            }

            var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString("D6");
            var maskedEmail = MaskEmail(email);

            var entry = new TwoFactorEntry
            {
                UserId = user.Id,
                Code = code,
                ExpiresAt = DateTime.UtcNow.AddMinutes(5),
                FailedAttempts = 0,
                LastSentAt = DateTime.UtcNow,
                Method = "EmailOtp",
                Email = email
            };

            _cache[user.Id] = entry;

            // Log mã OTP ra console để môi trường dev/local luôn kiểm tra được
            _logger.LogInformation("=================================================");
            _logger.LogInformation("[2FA OTP] Mã xác thực đăng nhập Quản trị cho {Username} ({Email}): {Code}", user.Username, email, code);
            _logger.LogInformation("=================================================");

            // Gửi email thực qua SMTP hoặc ghi log chi tiết
            await SendOtpEmailAsync(email, user.FullName ?? user.Username, code);

            return (code, maskedEmail);
        }

        /// <summary>
        /// Xác thực mã OTP hoặc mã TOTP Google Authenticator
        /// </summary>
        public bool VerifyCode(int userId, string inputCode, string? authenticatorSecret = null)
        {
            if (string.IsNullOrWhiteSpace(inputCode)) return false;

            // 1. Kiểm tra nếu có TOTP secret (Google Authenticator)
            if (!string.IsNullOrWhiteSpace(authenticatorSecret) && VerifyTotp(authenticatorSecret, inputCode))
            {
                _cache.TryRemove(userId, out _);
                return true;
            }

            // 2. Kiểm tra mã OTP gửi qua Email
            if (_cache.TryGetValue(userId, out var entry))
            {
                if (DateTime.UtcNow > entry.ExpiresAt)
                {
                    _cache.TryRemove(userId, out _);
                    return false;
                }

                if (entry.FailedAttempts >= 5)
                {
                    _cache.TryRemove(userId, out _);
                    return false;
                }

                if (string.Equals(entry.Code.Trim(), inputCode.Trim(), StringComparison.Ordinal))
                {
                    _cache.TryRemove(userId, out _);
                    return true;
                }

                entry.FailedAttempts++;
            }

            // Cho phép mã demo chỉ khi được cấu hình tường minh TwoFactor:AllowDemoCode == true (mặc định tắt hoàn toàn)
            if (inputCode.Trim() == "668899" && string.Equals(_configuration["TwoFactor:AllowDemoCode"], "true", StringComparison.OrdinalIgnoreCase))
            {
                _cache.TryRemove(userId, out _);
                return true;
            }

            return false;
        }

        /// <summary>
        /// Gửi lại mã OTP qua email (có cooldown 60s)
        /// </summary>
        public async Task<(bool Success, string Message, string MaskedEmail)> ResendOtpAsync(User user)
        {
            if (_cache.TryGetValue(user.Id, out var existing))
            {
                var elapsed = DateTime.UtcNow - existing.LastSentAt;
                if (elapsed.TotalSeconds < 60)
                {
                    var wait = (int)(60 - elapsed.TotalSeconds);
                    return (false, $"Vui lòng đợi {wait} giây trước khi yêu cầu gửi lại mã.", MaskEmail(existing.Email ?? user.Email ?? ""));
                }
            }

            var (_, masked) = await GenerateAndSendOtpAsync(user);
            return (true, "Mã xác thực mới đã được gửi tới email của bạn.", masked);
        }

        /// <summary>
        /// Che mờ địa chỉ email để bảo mật thông tin (vd: a***n@gmail.com)
        /// </summary>
        public static string MaskEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
                email = "tamthanhsk25@gmail.com";

            var parts = email.Split('@');
            var name = parts[0];
            var domain = parts[1];

            if (name.Length <= 2)
            {
                return $"{name[0]}***@{domain}";
            }

            return $"{name[0]}***{name[^1]}@{domain}";
        }

        /// <summary>
        /// Gửi mã xác thực qua Email (Hỗ trợ SMTP thực tế qua Gmail hoặc server nội bộ)
        /// </summary>
        private async Task SendOtpEmailAsync(string toEmail, string recipientName, string code)
        {
            var host = _configuration["Smtp:Host"];
            var port = _configuration.GetValue<int>("Smtp:Port", 587);
            var username = _configuration["Smtp:Username"]?.Trim();
            var rawPassword = _configuration["Smtp:Password"]?.Trim();
            var password = rawPassword?.Replace(" ", "");
            var fromEmail = _configuration["Smtp:FromEmail"]?.Trim() ?? (!string.IsNullOrWhiteSpace(username) ? username : "tamthanhsk25@gmail.com");
            var enableSsl = _configuration.GetValue<bool>("Smtp:EnableSsl", true);

            if (!string.IsNullOrWhiteSpace(host) && !string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
            {
                try
                {
                    using var message = new MailMessage();
                    message.From = new MailAddress(fromEmail, "VLXD Quản Trị Bảo Mật");
                    message.To.Add(new MailAddress(toEmail, recipientName));
                    message.Subject = $"[{code}] Mã xác thực 2 bước (2FA) đăng nhập Quản trị";
                    message.IsBodyHtml = true;
                    message.Body = $@"
                        <div style=""font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;"">
                            <h2 style=""color: #ea580c; text-align: center; margin-bottom: 24px;"">HỆ THỐNG QUẢN LÝ BÁN HÀNG VLXD</h2>
                            <div style=""background-color: #fff7ed; border-left: 4px solid #f97316; padding: 16px; margin-bottom: 20px; border-radius: 4px;"">
                                <h3 style=""margin: 0 0 8px 0; color: #9a3412;"">Mã xác thực đăng nhập Quản trị viên (2FA)</h3>
                                <p style=""margin: 0; color: #7c2d12; font-size: 14px;"">Xin chào <strong>{recipientName}</strong>, hệ thống vừa nhận được yêu cầu đăng nhập tài khoản Quản trị.</p>
                            </div>
                            <div style=""text-align: center; margin: 28px 0;"">
                                <span style=""display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; background: #f1f5f9; padding: 14px 28px; border-radius: 8px; border: 1px dashed #cbd5e1;"">{code}</span>
                                <p style=""color: #64748b; font-size: 13px; margin-top: 12px;"">Mã này có hiệu lực trong vòng <strong>5 phút</strong>. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.</p>
                            </div>
                            <hr style=""border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;""/>
                            <p style=""font-size: 12px; color: #94a3b8; text-align: center;"">Nếu bạn không thực hiện yêu cầu đăng nhập này, vui lòng liên hệ bộ phận hỗ trợ kỹ thuật hoặc đổi mật khẩu ngay lập tức.</p>
                        </div>";

                    using var client = new SmtpClient(host, port);
                    client.Credentials = new NetworkCredential(username, password);
                    client.EnableSsl = enableSsl;
                    await client.SendMailAsync(message);
                    _logger.LogInformation(">>> [SMTP SUCCESS] Đã gửi email OTP 2FA thành công tới {Email} qua {Host}!", toEmail, host);
                    return;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, ">>> [SMTP ERROR] Lỗi khi gửi email qua SMTP tới {Email}: {ErrorMessage}. Mã OTP vẫn được lưu và ghi nhận trong hệ thống.", toEmail, ex.Message);
                }
            }
            else
            {
                _logger.LogWarning(">>> [SMTP SKIPPED] Chưa cấu hình đầy đủ Smtp:Username hoặc Smtp:Password trong appsettings.");
            }

            _logger.LogInformation("[2FA OTP Simulated] Gửi email 2FA tới {Email}. Kính gửi {Name}, mã OTP của bạn là: {Code}", toEmail, recipientName, code);
        }

        /// <summary>
        /// Xác thực TOTP theo chuẩn RFC 6238 (Google Authenticator)
        /// </summary>
        private static bool VerifyTotp(string secretBase32, string code)
        {
            try
            {
                var secretBytes = Base32Decode(secretBase32);
                if (secretBytes.Length == 0) return false;

                var currentTimeStep = DateTimeOffset.UtcNow.ToUnixTimeSeconds() / 30;

                // Kiểm tra cửa sổ thời gian -1, 0, +1 để bù trừ lệch giờ
                for (var step = -1; step <= 1; step++)
                {
                    var timeStep = currentTimeStep + step;
                    var timeBytes = BitConverter.GetBytes(timeStep);
                    if (BitConverter.IsLittleEndian)
                        Array.Reverse(timeBytes);

                    using var hmac = new HMACSHA1(secretBytes);
                    var hash = hmac.ComputeHash(timeBytes);

                    var offset = hash[^1] & 0x0F;
                    var binaryCode = ((hash[offset] & 0x7F) << 24)
                                   | ((hash[offset + 1] & 0xFF) << 16)
                                   | ((hash[offset + 2] & 0xFF) << 8)
                                   | (hash[offset + 3] & 0xFF);

                    var totp = (binaryCode % 1000000).ToString("D6");
                    if (totp == code.Trim()) return true;
                }
            }
            catch
            {
                // Bỏ qua lỗi format
            }

            return false;
        }

        private static byte[] Base32Decode(string input)
        {
            if (string.IsNullOrEmpty(input)) return Array.Empty<byte>();

            const string chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
            var clean = input.Trim().ToUpperInvariant().Replace(" ", "").Replace("-", "");

            var output = new List<byte>();
            int buffer = 0, bitsLeft = 0;

            foreach (var c in clean)
            {
                var val = chars.IndexOf(c);
                if (val < 0) continue;

                buffer = (buffer << 5) | val;
                bitsLeft += 5;

                if (bitsLeft >= 8)
                {
                    output.Add((byte)((buffer >> (bitsLeft - 8)) & 0xFF));
                    bitsLeft -= 8;
                }
            }

            return output.ToArray();
        }
    }
}
