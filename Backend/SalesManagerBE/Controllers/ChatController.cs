using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Data;
using SalesManagerBE.Models;
using SalesManagerBE.Models.Dtos;

namespace SalesManagerBE.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly AppDbContext _context;
        public ChatController(AppDbContext context) { _context = context; }

        private int CurrentUserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        // Customer: lấy (hoặc tạo) hội thoại của chính mình + toàn bộ tin nhắn.
        [HttpGet("me")]
        public async Task<IActionResult> GetMyConversation()
        {
            var customerId = CurrentUserId;
            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (conversation == null)
            {
                conversation = new Conversation { CustomerId = customerId };
                _context.Conversations.Add(conversation);
                await _context.SaveChangesAsync();
            }

            var messages = await _context.Messages
                .Where(m => m.ConversationId == conversation.Id)
                .OrderBy(m => m.SentAt)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    ConversationId = m.ConversationId,
                    FromAdmin = m.FromAdmin,
                    Content = m.Content,
                    ImageUrl = m.ImageUrl,
                    SentAt = m.SentAt,
                    IsRead = m.IsRead,
                })
                .ToListAsync();

            return Ok(new { conversationId = conversation.Id, messages });
        }

        // Admin: danh sách toàn bộ hội thoại, mới nhất lên đầu.
        [HttpGet("conversations")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetConversations()
        {
            var conversations = await _context.Conversations
                .Include(c => c.Customer)
                .OrderByDescending(c => c.LastMessageAt)
                .ToListAsync();

            var result = new List<ConversationDto>();
            foreach (var c in conversations)
            {
                var last = await _context.Messages
                    .Where(m => m.ConversationId == c.Id)
                    .OrderByDescending(m => m.SentAt)
                    .FirstOrDefaultAsync();
                var unread = await _context.Messages
                    .CountAsync(m => m.ConversationId == c.Id && !m.FromAdmin && !m.IsRead);

                result.Add(new ConversationDto
                {
                    Id = c.Id,
                    CustomerId = c.CustomerId,
                    CustomerName = c.Customer?.FullName ?? c.Customer?.Username ?? "Khách",
                    LastMessageAt = c.LastMessageAt,
                    LastMessage = FormatLastMessage(last),
                    UnreadCount = unread,
                });
            }

            return Ok(result);
        }

        // Admin: toàn bộ tin nhắn của một hội thoại (đánh dấu tin của khách đã đọc).
        [HttpGet("conversations/{id}/messages")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetConversationMessages(int id)
        {
            var exists = await _context.Conversations.AnyAsync(c => c.Id == id);
            if (!exists) return NotFound();

            var unread = await _context.Messages
                .Where(m => m.ConversationId == id && !m.FromAdmin && !m.IsRead)
                .ToListAsync();
            if (unread.Count > 0)
            {
                foreach (var m in unread) m.IsRead = true;
                await _context.SaveChangesAsync();
            }

            var messages = await _context.Messages
                .Where(m => m.ConversationId == id)
                .OrderBy(m => m.SentAt)
                .Select(m => new MessageDto
                {
                    Id = m.Id,
                    ConversationId = m.ConversationId,
                    FromAdmin = m.FromAdmin,
                    Content = m.Content,
                    ImageUrl = m.ImageUrl,
                    SentAt = m.SentAt,
                    IsRead = m.IsRead,
                })
                .ToListAsync();

            return Ok(messages);
        }

        private static string? FormatLastMessage(Message? m)
        {
            if (m == null) return null;
            if (!string.IsNullOrWhiteSpace(m.Content)) return m.Content;
            return m.ImageUrl != null ? "[Hình ảnh]" : null;
        }
    }
}
