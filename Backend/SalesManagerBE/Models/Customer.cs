namespace SalesManagerBE.Models
{
    public class Customer
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Address { get; set; }
        public bool IsBusiness { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<SalesInvoice> Invoices { get; set; } = new();
    }
}
