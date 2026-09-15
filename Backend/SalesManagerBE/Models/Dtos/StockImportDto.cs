namespace SalesManagerBE.Models.Dtos
{
    public class StockImportPreviewRowDto
    {
        public int RowNumber { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string? ProductName { get; set; }
        public int? ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Note { get; set; }

        public string Status { get; set; } = "Valid";
        public string? Message { get; set; }
    }

    public class StockImportCommitRowDto
    {
        public int ProductId { get; set; }
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Note { get; set; }
    }

    public class StockImportCommitDto
    {
        public List<StockImportCommitRowDto> Rows { get; set; } = new();
    }
}
