namespace SalesManagerBE.Models
{
    public class ProductCategory
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public List<Product> Products { get; set; } = new();
        public List<ProductNameTemplate> ProductNameTemplates { get; set; } = new();
    }
}
