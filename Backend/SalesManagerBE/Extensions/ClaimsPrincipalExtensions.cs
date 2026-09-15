using System.Security.Claims;

namespace SalesManagerBE.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
                /// <summary>
        /// Lấy ID của người dùng từ ClaimsPrincipal hiện tại
        /// </summary>
        public static int? GetUserId(this ClaimsPrincipal user)
        {
            var raw = user.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(raw, out var id) ? id : null;
        }

                /// <summary>
        /// Lấy tên đăng nhập của người dùng từ Claims
        /// </summary>
        public static string? GetUsername(this ClaimsPrincipal user)
            => user.FindFirstValue(ClaimTypes.Name);
    }
}
