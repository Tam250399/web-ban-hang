namespace SalesManagerBE.Models.Dtos
{
    public class CustomerDto
    {
        public string FullName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? Address { get; set; }
        public bool IsBusiness { get; set; }
    }
}
