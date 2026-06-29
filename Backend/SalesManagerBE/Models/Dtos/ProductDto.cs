namespace SalesManagerBE.Models.Dtos
{
    public class CreateProductDto
    {
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal StockQuantity { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Category { get; set; }
        public int? CategoryId { get; set; }
        public int? UnitTypeId { get; set; }
    }

    public class StockTransactionDto
    {
        public int ProductId { get; set; }
        public string Type { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Note { get; set; }
    }
}
