namespace SalesManagerBE.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? PhoneNumber { get; set; }
        public int? RoleId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public Role? Role { get; set; }
    }
}
