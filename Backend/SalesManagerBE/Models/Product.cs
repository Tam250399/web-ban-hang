namespace SalesManagerBE.Models
{
    public class Product
    {
        public int Id { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public decimal StockQuantity { get; set; }
        public string? Description { get; set; }
        public string? ImageUrl { get; set; }
        public string? Category { get; set; }
        public int? CategoryId { get; set; }
        public ProductCategory? ProductCategory { get; set; }
        public int? UnitTypeId { get; set; }
        public UnitType? UnitType { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<StockTransaction> Transactions { get; set; } = new();
    }
}
