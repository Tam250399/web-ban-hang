using System.Security.Claims;

namespace SalesManagerBE.Extensions
{
    public static class ClaimsPrincipalExtensions
    {
                public static int? GetUserId(this ClaimsPrincipal user)
        {
            var raw = user.FindFirstValue(ClaimTypes.NameIdentifier);
            return int.TryParse(raw, out var id) ? id : null;
        }

                public static string? GetUsername(this ClaimsPrincipal user)
            => user.FindFirstValue(ClaimTypes.Name);
    }
}
