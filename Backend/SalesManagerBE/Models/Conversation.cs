namespace SalesManagerBE.Models
{

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
