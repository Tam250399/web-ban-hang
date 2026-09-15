namespace SalesManagerBE.Models
{
    public class Message
    {
        public int Id { get; set; }
        public int ConversationId { get; set; }
        public int SenderId { get; set; }

        public bool FromAdmin { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }
        public DateTime SentAt { get; set; } = DateTime.UtcNow;
        public bool IsRead { get; set; }

        public Conversation? Conversation { get; set; }
        public User? Sender { get; set; }
    }
}
