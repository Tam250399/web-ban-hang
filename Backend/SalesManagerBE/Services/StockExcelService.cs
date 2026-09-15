using ClosedXML.Excel;
using SalesManagerBE.Models;

namespace SalesManagerBE.Services
{
    public class StockImportRawRow
    {
        public int RowNumber { get; set; }
        public string ProductCode { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public string? Note { get; set; }
    }

    public interface IStockExcelService
    {
        byte[] GenerateImportTemplate(List<Product> products);
        List<StockImportRawRow> ParseImportFile(Stream fileStream);
    }

    public class StockExcelService : IStockExcelService
    {
        private static readonly string[] Headers = { "Mã sản phẩm*", "Số lượng*", "Đơn giá*", "Ghi chú" };
        private const int TemplateDataRows = 200;

        public byte[] GenerateImportTemplate(List<Product> products)
        {
            using var workbook = new XLWorkbook();
            var ws = workbook.Worksheets.Add("Nhập kho");

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
            ws.Column(2).Width = 12;
            ws.Column(3).Width = 14;
            ws.Column(4).Width = 32;

            var lastRow = TemplateDataRows + 1;
            var codes = products.Select(p => p.ProductCode).Distinct().OrderBy(c => c).ToList();

            var listSheet = workbook.Worksheets.Add("Lists");
            for (int i = 0; i < codes.Count; i++) listSheet.Cell(i + 1, 1).Value = codes[i];
            listSheet.Visibility = XLWorksheetVisibility.VeryHidden;

            if (codes.Count > 0)
            {
                var codeRange = listSheet.Range(1, 1, codes.Count, 1);
                var dv = ws.Range(2, 1, lastRow, 1).CreateDataValidation();
                dv.List(codeRange, true);
                dv.IgnoreBlanks = true;
                dv.InCellDropdown = true;
            }

            var refSheet = workbook.Worksheets.Add("Danh sách sản phẩm");
            refSheet.Cell(1, 1).Value = "Mã sản phẩm";
            refSheet.Cell(1, 2).Value = "Tên sản phẩm";
            refSheet.Cell(1, 3).Value = "Tồn hiện tại";
            refSheet.Range(1, 1, 1, 3).Style.Font.Bold = true;
            int r = 2;
            foreach (var p in products.OrderBy(p => p.ProductCode))
            {
                refSheet.Cell(r, 1).Value = p.ProductCode;
                refSheet.Cell(r, 2).Value = p.ProductName;
                refSheet.Cell(r, 3).Value = p.StockQuantity;
                r++;
            }
            refSheet.Columns().AdjustToContents();

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }

        public List<StockImportRawRow> ParseImportFile(Stream fileStream)
        {
            var result = new List<StockImportRawRow>();
            using var workbook = new XLWorkbook(fileStream);
            var ws = workbook.Worksheets.First();
            var lastRow = ws.LastRowUsed()?.RowNumber() ?? 1;

            for (int r = 2; r <= lastRow; r++)
            {
                var row = ws.Row(r);
                var code = row.Cell(1).GetString().Trim();
                var qtyCell = row.Cell(2);
                if (string.IsNullOrWhiteSpace(code) && qtyCell.IsEmpty()) continue;

                result.Add(new StockImportRawRow
                {
                    RowNumber = r,
                    ProductCode = code,
                    Quantity = qtyCell.TryGetValue<decimal>(out var qty) ? qty : 0,
                    UnitPrice = row.Cell(3).TryGetValue<decimal>(out var price) ? price : 0,
                    Note = row.Cell(4).GetString().Trim(),
                });
            }

            return result;
        }
    }
}
