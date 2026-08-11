namespace SalesManagerBE.Models
{
    public class SalesInvoice
    {
        public int Id { get; set; }
        public string CustomerName { get; set; } = string.Empty;
        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
        public string? PreparedByName { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<StockTransaction> Items { get; set; } = new();
    }
}
