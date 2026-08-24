namespace SalesManagerBE.Models
{
    public class ContactInfo
    {
        public int Id { get; set; }
        public string Address { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string WorkingHours { get; set; } = string.Empty;
        public bool IsActive { get; set; }
    }
}
