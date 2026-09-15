namespace SalesManagerBE.Models
{
    public class StockTransaction
    {
        public int Id { get; set; }
        public int ProductId { get; set; }
        public Product? Product { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Note { get; set; }
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
        public int? SalesInvoiceId { get; set; }
        public SalesInvoice? SalesInvoice { get; set; }
    }
}
