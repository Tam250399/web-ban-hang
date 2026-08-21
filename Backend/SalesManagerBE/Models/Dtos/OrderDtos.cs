namespace SalesManagerBE.Models.Dtos
{
    public class CreateOrderItemDto
    {
        public int ProductId { get; set; }
        public decimal Quantity { get; set; }
    }

    public class CreateOrderDto
    {
        public string RecipientName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Address { get; set; }
        public string? Note { get; set; }
        public List<CreateOrderItemDto> Items { get; set; } = new();
    }

    public class ConfirmOrderDto
    {
    }

    public class CancelOrderDto
    {
        public string? Reason { get; set; }
    }
}
