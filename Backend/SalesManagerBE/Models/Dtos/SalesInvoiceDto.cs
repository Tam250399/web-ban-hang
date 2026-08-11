namespace SalesManagerBE.Models.Dtos
{
    public class SalesInvoiceItemDto
    {
        public int ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }

    public class CreateSalesInvoiceDto
    {
        public int CustomerId { get; set; }
        public DateTime InvoiceDate { get; set; } = DateTime.UtcNow;
        public string? PreparedByName { get; set; }
        public List<SalesInvoiceItemDto> Items { get; set; } = new();
    }
}
