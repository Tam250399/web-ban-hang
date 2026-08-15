using ClosedXML.Excel;
using SalesManagerBE.Models;

namespace SalesManagerBE.Services
{
    public interface IExcelExportService
    {
        byte[] ExportSalesInvoice(SalesInvoice invoice);
        byte[] ExportSalesInvoicesMerged(List<SalesInvoice> invoices, string preparedByName);
    }

    public class ExcelExportService : IExcelExportService
    {
        private const string TemplateSheetName = "T3-22";
        private const int ItemsPerPage = 20;
        private const int FirstItemRow = 6;
        private const double MinRowHeight = 21;
        private const double MaxColumnBWidth = 45;

        // Template cố định độ rộng cột B và chiều cao dòng (21pt/1 dòng) nên tên vật
        // liệu dài sẽ wrap 2-3 dòng và tràn đè lên dòng kế tiếp. Nới cột B theo tên
        // dài nhất trong trang rồi giãn chiều cao từng dòng theo đúng nội dung của nó.
        private static void AutoFitItemRows(IXLWorksheet ws, int firstRow, int lastRow)
        {
            if (lastRow < firstRow) return;

            ws.Column(2).AdjustToContents(firstRow, lastRow);
            if (ws.Column(2).Width > MaxColumnBWidth) ws.Column(2).Width = MaxColumnBWidth;

            ws.Rows(firstRow, lastRow).AdjustToContents();
            foreach (var r in ws.Rows(firstRow, lastRow))
            {
                if (r.Height < MinRowHeight) r.Height = MinRowHeight;
            }
        }

        private readonly string _templatePath;

        public ExcelExportService(IWebHostEnvironment env)
        {
            _templatePath = Path.Combine(env.ContentRootPath, "Templates", "PhieuBanHang.xlsx");
        }

        public byte[] ExportSalesInvoice(SalesInvoice invoice)
        {
            using var workbook = new XLWorkbook(_templatePath);
            var templateSheet = workbook.Worksheet(TemplateSheetName);

            var items = invoice.Items.OrderBy(i => i.Id).ToList();
            var pages = new List<List<StockTransaction>>();
            for (int i = 0; i < items.Count; i += ItemsPerPage)
                pages.Add(items.Skip(i).Take(ItemsPerPage).ToList());
            if (pages.Count == 0) pages.Add(new List<StockTransaction>());

            var sheets = new List<IXLWorksheet> { templateSheet };
            for (int p = 1; p < pages.Count; p++)
                sheets.Add(templateSheet.CopyTo($"{TemplateSheetName} ({p + 1})"));

            for (int p = 0; p < pages.Count; p++)
            {
                var ws = sheets[p];
                ws.Cell("A1").Value = "CỬA HÀNG VẬT LIỆU XÂY DỰNG ĐỨC LỢI";
                ws.Cell("A2").Value = "Địa chỉ: Khánh Tân, Sài Sơn, Quốc Oai, Hà Nội";
                ws.Cell("A3").Value = "Số điện thoại: 0901 234 567";
                ws.Cell("A4").Value = $"Khách hàng: {invoice.CustomerName}" + (p > 0 ? " (tiếp trang)" : "");

                int row = FirstItemRow;
                foreach (var item in pages[p])
                {
                    var dateCell = ws.Cell(row, 1);
                    dateCell.Value = invoice.InvoiceDate;
                    dateCell.Style.DateFormat.Format = "dd/MM/yyyy";
                    ws.Cell(row, 2).Value = item.Product?.ProductName ?? "";
                    ws.Cell(row, 3).Value = item.Quantity;
                    ws.Cell(row, 4).Value = item.Product?.Unit ?? "";
                    ws.Cell(row, 5).Value = item.UnitPrice;
                    row++;
                }

                AutoFitItemRows(ws, FirstItemRow, row - 1);

                ws.Cell("D30").Value = "Cửa hàng VLXD Lý Sáu";
                ws.Cell("D31").Value = "";
                ws.Cell("D32").Value = invoice.PreparedByName ?? "";
            }

            workbook.RecalculateAllFormulas();

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }

        private class DateBlock
        {
            public DateTime Date { get; set; }
            public List<StockTransaction> Items { get; set; } = new();
        }

        public byte[] ExportSalesInvoicesMerged(List<SalesInvoice> invoices, string preparedByName)
        {
            using var workbook = new XLWorkbook(_templatePath);
            var templateSheet = workbook.Worksheet(TemplateSheetName);
            bool firstPageUsed = false;
            int pageCounter = 0;

            var customerGroups = invoices
                .GroupBy(i => i.CustomerName)
                .OrderBy(g => g.Min(i => i.InvoiceDate));

            foreach (var group in customerGroups)
            {
                // Mỗi phiếu (SalesInvoice) = 1 khối ngày; phiếu >20 dòng thì chẻ thành nhiều khối con
                var blocks = new List<DateBlock>();
                foreach (var inv in group.OrderBy(i => i.InvoiceDate))
                {
                    var items = inv.Items.OrderBy(i => i.Id).ToList();
                    if (items.Count == 0)
                    {
                        blocks.Add(new DateBlock { Date = inv.InvoiceDate });
                        continue;
                    }
                    for (int i = 0; i < items.Count; i += ItemsPerPage)
                        blocks.Add(new DateBlock { Date = inv.InvoiceDate, Items = items.Skip(i).Take(ItemsPerPage).ToList() });
                }

                // Dồn khối vào trang, không chẻ đôi 1 khối giữa 2 trang
                var pages = new List<List<DateBlock>>();
                var currentPage = new List<DateBlock>();
                int currentCount = 0;
                foreach (var block in blocks)
                {
                    if (currentCount > 0 && currentCount + block.Items.Count > ItemsPerPage)
                    {
                        pages.Add(currentPage);
                        currentPage = new List<DateBlock>();
                        currentCount = 0;
                    }
                    currentPage.Add(block);
                    currentCount += block.Items.Count;
                }
                if (currentPage.Count > 0) pages.Add(currentPage);

                foreach (var page in pages)
                {
                    pageCounter++;
                    IXLWorksheet ws;
                    if (!firstPageUsed)
                    {
                        ws = templateSheet;
                        firstPageUsed = true;
                    }
                    else
                    {
                        ws = templateSheet.CopyTo($"Trang{pageCounter}");
                    }

                    ws.Cell("A1").Value = "CỬA HÀNG VẬT LIỆU XÂY DỰNG ĐỨC LỢI";
                    ws.Cell("A2").Value = "Địa chỉ: Khánh Tân, Sài Sơn, Quốc Oai, Hà Nội";
                    ws.Cell("A3").Value = "Số điện thoại: 0901 234 567";
                    ws.Cell("A4").Value = $"Khách hàng: {group.Key}";

                    int row = FirstItemRow;
                    foreach (var block in page)
                    {
                        int startRow = row;
                        foreach (var item in block.Items)
                        {
                            ws.Cell(row, 2).Value = item.Product?.ProductName ?? "";
                            ws.Cell(row, 3).Value = item.Quantity;
                            ws.Cell(row, 4).Value = item.Product?.Unit ?? "";
                            ws.Cell(row, 5).Value = item.UnitPrice;
                            row++;
                        }
                        int endRow = row - 1;
                        if (endRow >= startRow)
                        {
                            if (endRow > startRow)
                                ws.Range(startRow, 1, endRow, 1).Merge();
                            var dateCell = ws.Cell(startRow, 1);
                            dateCell.Value = block.Date;
                            dateCell.Style.DateFormat.Format = "dd/MM/yyyy";
                        }
                    }

                    AutoFitItemRows(ws, FirstItemRow, row - 1);

                    var minDate = page.Min(b => b.Date);
                    var maxDate = page.Max(b => b.Date);
                    ws.Cell("A27").Value = minDate.Date == maxDate.Date
                        ? $"Tổng ngày {minDate:dd/MM/yyyy}"
                        : $"Tổng từ ngày {minDate:dd/MM/yyyy} đến ngày {maxDate:dd/MM/yyyy}";

                    ws.Cell("D30").Value = "Cửa hàng VLXD Lý Sáu";
                    ws.Cell("D31").Value = "";
                    ws.Cell("D32").Value = preparedByName ?? "";
                }
            }

            workbook.RecalculateAllFormulas();

            using var ms = new MemoryStream();
            workbook.SaveAs(ms);
            return ms.ToArray();
        }
    }
}
