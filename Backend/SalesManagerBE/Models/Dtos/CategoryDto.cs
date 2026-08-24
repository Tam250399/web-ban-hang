namespace SalesManagerBE.Models.Dtos
{
    public class CategoryDto
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public bool ShowOnHome { get; set; } = true;
    }

    public class ProductNameTemplateDto
    {
        public string Name { get; set; } = string.Empty;
        public int? CategoryId { get; set; }
    }
}
