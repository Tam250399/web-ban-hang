namespace SalesManagerBE.Models
{
    // Mỗi khách hàng có đúng một hội thoại với shop (phía admin trả lời chung).
    public class Conversation
    {
        public int Id { get; set; }
        public int CustomerId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime LastMessageAt { get; set; } = DateTime.UtcNow;

        public User? Customer { get; set; }
        public ICollection<Message> Messages { get; set; } = new List<Message>();
    }
}
