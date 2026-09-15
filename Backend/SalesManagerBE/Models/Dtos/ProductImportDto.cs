namespace SalesManagerBE.Models.Dtos
{
    public class ProductImportPreviewRowDto
    {
        public int RowNumber { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string? UnitName { get; set; }
        public decimal Price { get; set; }
        public decimal StockQuantity { get; set; }
        public string? Description { get; set; }

        public string Status { get; set; } = "New";
        public string? Message { get; set; }
    }

    public class ProductImportCommitRowDto
    {
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string? UnitName { get; set; }
        public decimal Price { get; set; }
        public decimal StockQuantity { get; set; }
        public string? Description { get; set; }

        public bool Overwrite { get; set; }
    }

    public class ProductImportCommitDto
    {
        public List<ProductImportCommitRowDto> Rows { get; set; } = new();
    }
}
