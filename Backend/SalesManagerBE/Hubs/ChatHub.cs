using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SalesManagerBE.Data;
using SalesManagerBE.Models;
using SalesManagerBE.Models.Dtos;
using SalesManagerBE.Services;

namespace SalesManagerBE.Hubs
{
    // Chat hỗ trợ: mọi Customer nhắn về Admin, chỉ Admin đọc được tin của Customer.
    [Authorize]
    public class ChatHub : Hub
    {
        public const string AdminsGroup = "Admins";
        private readonly AppDbContext _context;
        private readonly ChatPresenceService _presence;

        public ChatHub(AppDbContext context, ChatPresenceService presence)
        {
            _context = context;
            _presence = presence;
        }

        private int UserId => int.Parse(Context.User!.FindFirstValue(ClaimTypes.NameIdentifier)!);
        private bool IsAdmin => Context.User!.IsInRole("Admin");

        public override async Task OnConnectedAsync()
        {
            if (IsAdmin)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, AdminsGroup);
            }
            else
            {
                var conversation = await GetOrCreateConversationAsync(UserId);
                await Groups.AddToGroupAsync(Context.ConnectionId, ConvGroup(conversation.Id));

                if (_presence.MarkConnected(UserId))
                {
                    await Clients.Group(AdminsGroup).SendAsync("CustomerPresenceChanged", UserId, true);
                }
            }
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            if (!IsAdmin && _presence.MarkDisconnected(UserId))
            {
                await Clients.Group(AdminsGroup).SendAsync("CustomerPresenceChanged", UserId, false);
            }
            await base.OnDisconnectedAsync(exception);
        }

        // Khách hàng gửi tin nhắn về shop (conversation của chính họ). Có thể kèm ảnh
        // (imageUrl từ /api/upload/image), content có thể rỗng nếu chỉ gửi ảnh.
        public async Task SendMessage(string content, string? imageUrl = null)
        {
            if (IsAdmin) return;
            if (string.IsNullOrWhiteSpace(content) && string.IsNullOrWhiteSpace(imageUrl)) return;

            var conversation = await GetOrCreateConversationAsync(UserId);
            var message = await SaveMessageAsync(conversation, UserId, fromAdmin: false, content, imageUrl);

            await Clients.Group(ConvGroup(conversation.Id)).SendAsync("ReceiveMessage", message);
            await Clients.Group(AdminsGroup).SendAsync("ConversationUpdated", await ToConversationDtoAsync(conversation.Id));
        }

        // Admin trả lời một hội thoại cụ thể, có thể kèm ảnh.
        public async Task ReplyToConversation(int conversationId, string content, string? imageUrl = null)
        {
            if (!IsAdmin) return;
            if (string.IsNullOrWhiteSpace(content) && string.IsNullOrWhiteSpace(imageUrl)) return;

            var conversation = await _context.Conversations.FindAsync(conversationId);
            if (conversation == null) return;

            var message = await SaveMessageAsync(conversation, UserId, fromAdmin: true, content, imageUrl);

            await Clients.Group(ConvGroup(conversation.Id)).SendAsync("ReceiveMessage", message);
            await Clients.Group(AdminsGroup).SendAsync("ConversationUpdated", await ToConversationDtoAsync(conversation.Id));
        }

        // Admin mở xem một hội thoại để nhận tin realtime + đánh dấu đã đọc.
        public async Task JoinConversation(int conversationId)
        {
            if (!IsAdmin) return;
            await Groups.AddToGroupAsync(Context.ConnectionId, ConvGroup(conversationId));
            await MarkReadAsync(conversationId, fromAdminSide: true);
        }

        public async Task LeaveConversation(int conversationId)
        {
            if (!IsAdmin) return;
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, ConvGroup(conversationId));
        }

        // Khách hàng đánh dấu đã đọc các tin của admin trong hội thoại của mình.
        public async Task MarkRead()
        {
            if (IsAdmin) return;
            var conversation = await GetOrCreateConversationAsync(UserId);
            await MarkReadAsync(conversation.Id, fromAdminSide: false);
        }

        private async Task MarkReadAsync(int conversationId, bool fromAdminSide)
        {
            var unread = await _context.Messages
                .Where(m => m.ConversationId == conversationId && m.FromAdmin != fromAdminSide && !m.IsRead)
                .ToListAsync();
            if (unread.Count == 0) return;
            foreach (var m in unread) m.IsRead = true;
            await _context.SaveChangesAsync();
        }

        private async Task<Conversation> GetOrCreateConversationAsync(int customerId)
        {
            var conversation = await _context.Conversations.FirstOrDefaultAsync(c => c.CustomerId == customerId);
            if (conversation != null) return conversation;

            conversation = new Conversation { CustomerId = customerId };
            _context.Conversations.Add(conversation);
            await _context.SaveChangesAsync();
            return conversation;
        }

        private async Task<MessageDto> SaveMessageAsync(Conversation conversation, int senderId, bool fromAdmin, string? content, string? imageUrl)
        {
            var message = new Message
            {
                ConversationId = conversation.Id,
                SenderId = senderId,
                FromAdmin = fromAdmin,
                Content = content?.Trim() ?? string.Empty,
                ImageUrl = string.IsNullOrWhiteSpace(imageUrl) ? null : imageUrl,
            };
            _context.Messages.Add(message);
            conversation.LastMessageAt = message.SentAt;
            await _context.SaveChangesAsync();

            return new MessageDto
            {
                Id = message.Id,
                ConversationId = message.ConversationId,
                FromAdmin = message.FromAdmin,
                Content = message.Content,
                ImageUrl = message.ImageUrl,
                SentAt = message.SentAt,
                IsRead = message.IsRead,
            };
        }

        private async Task<ConversationDto> ToConversationDtoAsync(int conversationId)
        {
            var c = await _context.Conversations.Include(x => x.Customer).FirstAsync(x => x.Id == conversationId);
            var last = await _context.Messages
                .Where(m => m.ConversationId == conversationId)
                .OrderByDescending(m => m.SentAt)
                .FirstOrDefaultAsync();
            var unread = await _context.Messages
                .CountAsync(m => m.ConversationId == conversationId && !m.FromAdmin && !m.IsRead);

            return new ConversationDto
            {
                Id = c.Id,
                CustomerId = c.CustomerId,
                CustomerName = c.Customer?.FullName ?? c.Customer?.Username ?? "Khách",
                LastMessageAt = c.LastMessageAt,
                LastMessage = FormatLastMessage(last),
                UnreadCount = unread,
                IsOnline = _presence.IsOnline(c.CustomerId),
            };
        }

        private static string? FormatLastMessage(Message? m)
        {
            if (m == null) return null;
            if (!string.IsNullOrWhiteSpace(m.Content)) return m.Content;
            return m.ImageUrl != null ? "[Hình ảnh]" : null;
        }

        private static string ConvGroup(int conversationId) => $"conv-{conversationId}";
    }
}
