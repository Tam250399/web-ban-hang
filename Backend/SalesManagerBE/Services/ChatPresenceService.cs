using System.Collections.Concurrent;

namespace SalesManagerBE.Services
{
    public class ChatPresenceService
    {
        private readonly ConcurrentDictionary<int, int> _onlineCustomers = new();

        /// <summary>
        /// Ghi nhận kết nối mới của khách hàng vào danh sách trực tuyến
        /// </summary>
        public bool MarkConnected(int customerId)
        {
            var count = _onlineCustomers.AddOrUpdate(customerId, 1, (_, c) => c + 1);
            return count == 1;
        }

        /// <summary>
        /// Ghi nhận ngắt kết nối của khách hàng và xóa khỏi danh sách trực tuyến khi không còn kết nối nào
        /// </summary>
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

        /// <summary>
        /// Kiểm tra xem khách hàng có đang trực tuyến hay không
        /// </summary>
        public bool IsOnline(int customerId) => _onlineCustomers.ContainsKey(customerId);
    }
}

