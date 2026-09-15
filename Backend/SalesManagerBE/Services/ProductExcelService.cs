using ClosedXML.Excel;
using SalesManagerBE.Models;

namespace SalesManagerBE.Services
{
    public class ProductImportRawRow
    {
        public int RowNumber { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public string ProductName { get; set; } = string.Empty;
        public string? CategoryName { get; set; }
        public string? UnitName { get; set; }
        public decimal Price { get; set; }
        public decimal StockQuantity { get; set; }
        public string? Description { get; set; }
    }

    public interface IProductExcelService
    {
        byte[] GenerateImportTemplate(List<string> categoryNames, List<string> unitNames);
        byte[] ExportProducts(List<Product> products);
        List<ProductImportRawRow> ParseImportFile(Stream fileStream);
    }

    public class ProductExcelService : IProductExcelService
    {
        private static readonly string[] Headers =
            { "Mã sản phẩm*", "Tên sản phẩm*", "Danh mục", "Đơn vị tính", "Giá bán*", "Tồn kho*", "Mô tả" };

        private const int TemplateDataRows = 200;

        public byte[] GenerateImportTemplate(List<string> categoryNames, List<string> unitNames)
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Nhập sản phẩm");

            for (int i = 0; i < Headers.Length; i++)
            {
                var cell = ws.Cell(1, i + 1);
                cell.Value = Headers[i];
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1F1D1A");
                cell.Style.Font.FontColor = XLColor.White;
            }
            ws.SheetView.FreezeRows(1);
            ws.Column(1).Width = 16;
            ws.Column(2).Width = 32;
            ws.Column(3).Width = 20;
            ws.Column(4).Width = 16;
            ws.Column(5).Width = 14;
            ws.Column(6).Width = 12;
            ws.Column(7).Width = 32;

            var lastRow = TemplateDataRows + 1;

            var listSheet = workbook.Worksheets.Add("Lists");
            for (int i = 0; i < categoryNames.Count; i++) listSheet.Cell(i + 1, 1).Value = categoryNames[i];
            for (int i = 0; i < unitNames.Count; i++) listSheet.Cell(i + 1, 2).Value = unitNames[i];
            listSheet.Visibility = XLWorksheetVisibility.VeryHidden;

            if (categoryNames.Count > 0)
            {
                var catRange = listSheet.Range(1, 1, categoryNames.Count, 1);
                var dv = ws.Range(2, 3, lastRow, 3).CreateDataValidation();
                dv.List(catRange, true);
                dv.IgnoreBlanks = true;
                dv.InCellDropdown = true;
            }
            if (unitNames.Count > 0)
            {
                var unitRange = listSheet.Range(1, 2, unitNames.Count, 2);
                var dv = ws.Range(2, 4, lastRow, 4).CreateDataValidation();
                dv.List(unitRange, true);
                dv.IgnoreBlanks = true;
                dv.InCellDropdown = true;
            }

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }

        public byte[] ExportProducts(List<Product> products)
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Sản phẩm");

            for (int i = 0; i < Headers.Length; i++)
            {
                var cell = ws.Cell(1, i + 1);
                cell.Value = Headers[i].TrimEnd('*');
                cell.Style.Font.Bold = true;
                cell.Style.Fill.BackgroundColor = XLColor.FromHtml("#1F1D1A");
                cell.Style.Font.FontColor = XLColor.White;
            }
            ws.SheetView.FreezeRows(1);

            int row = 2;
            foreach (var p in products)
            {
                ws.Cell(row, 1).Value = p.ProductCode;
                ws.Cell(row, 2).Value = p.ProductName;
                ws.Cell(row, 3).Value = p.Category ?? "";
                ws.Cell(row, 4).Value = p.Unit;
                ws.Cell(row, 5).Value = p.Price;
                ws.Cell(row, 6).Value = p.StockQuantity;
                ws.Cell(row, 7).Value = p.Description ?? "";
                row++;
            }

            ws.Columns().AdjustToContents();

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }

        public List<ProductImportRawRow> ParseImportFile(Stream fileStream)
        {
            var result = new List<ProductImportRawRow>();
            using var workbook = new XLWorkbook(fileStream);
            var ws = workbook.Worksheets.First();
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;

            for (int r = 2; r <= lastRow; r++)
            {
                var row = ws.Row(r);
                var code = row.Cell(1).GetString().Trim();
                var name = row.Cell(2).GetString().Trim();
                if (string.IsNullOrWhiteSpace(code) && string.IsNullOrWhiteSpace(name)) continue;

                result.Add(new ProductImportRawRow
                {
                    RowNumber = r,
                    ProductCode = code,
                    ProductName = name,
                    CategoryName = row.Cell(3).GetString().Trim(),
                    UnitName = row.Cell(4).GetString().Trim(),
                    Price = row.Cell(5).TryGetValue<decimal>(out var price) ? price : 0,
                    StockQuantity = row.Cell(6).TryGetValue<decimal>(out var qty) ? qty : 0,
                    Description = row.Cell(7).GetString().Trim(),
                });
            }

            return result;
        }
    }
}
