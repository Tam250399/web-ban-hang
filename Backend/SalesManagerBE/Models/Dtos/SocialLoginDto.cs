namespace SalesManagerBE.Models.Dtos
{
    public class SocialLoginDto
    {
        public string Provider { get; set; } = string.Empty; // "Google" | "Facebook"
        public string? Token { get; set; }
        public string? Email { get; set; }
        public string? Name { get; set; }
        public string? ProviderKey { get; set; }
        public string? PhotoUrl { get; set; }
    }
}
