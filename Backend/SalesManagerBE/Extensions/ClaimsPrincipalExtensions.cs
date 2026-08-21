using System.Security.Claims;

namespace SalesManagerBE.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
        /// <summary>
        /// Lấy Id người dùng từ claim NameIdentifier của JWT.
        /// Trả về null nếu chưa đăng nhập hoặc claim không hợp lệ.
        /// </summary>
        public static int? GetUserId(this ClaimsPrincipal user)
        {
            var raw = user.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(raw, out var id) ? id : null;
        }

        /// <summary>Tên đăng nhập từ claim Name (dùng làm phương án dự phòng khi không tra được hồ sơ).</summary>
        public static string? GetUsername(this ClaimsPrincipal user)
            => user.FindFirstValue(ClaimTypes.Name);
    }
}
