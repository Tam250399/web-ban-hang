using System.Collections.Concurrent;

namespace SalesManagerBE.Services
{
    // Đếm số kết nối SignalR đang mở của mỗi customer (một khách có thể mở nhiều tab)
    // để biết khách đang online hay không. Đăng ký Singleton vì ChatHub tạo mới theo
    // từng request nhưng trạng thái online cần dùng chung cho mọi kết nối.
    public class ChatPresenceService
    {
        private readonly ConcurrentDictionary<int, int> _onlineCustomers = new();

        // Trả về true nếu đây là kết nối đầu tiên của customer (vừa chuyển sang online).
        public bool MarkConnected(int customerId)
        {
            var count = _onlineCustomers.AddOrUpdate(customerId, 1, (_, c) => c + 1);
            return count == 1;
        }

        // Trả về true nếu customer không còn kết nối nào (vừa chuyển sang offline).
        public bool MarkDisconnected(int customerId)
        {
            var count = _onlineCustomers.AddOrUpdate(customerId, 0, (_, c) => Math.Max(0, c - 1));
            if (count == 0)
            {
                _onlineCustomers.TryRemove(customerId, out _);
                return true;
            }
            return false;
        }

        public bool IsOnline(int customerId) => _onlineCustomers.ContainsKey(customerId);
    }
}
