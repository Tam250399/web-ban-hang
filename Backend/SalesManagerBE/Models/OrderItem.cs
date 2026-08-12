namespace SalesManagerBE.Models
{
    public class OrderItem
    {
        public int Id { get; set; }
        public int OrderId { get; set; }
        public Order? Order { get; set; }

        public int ProductId { get; set; }
        public Product? Product { get; set; }
        // Lưu lại tên/giá tại thời điểm đặt hàng để lịch sử đơn hàng không đổi
        // ngay cả khi sản phẩm bị đổi tên/giá hoặc xoá sau này.
        public string ProductName { get; set; } = string.Empty;
        public decimal Quantity { get; set; }
        public decimal UnitPrice { get; set; }
    }
}
