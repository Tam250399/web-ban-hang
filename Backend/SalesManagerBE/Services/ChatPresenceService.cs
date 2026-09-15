using System.Collections.Concurrent;

namespace SalesManagerBE.Services
{

    public class ChatPresenceService
    {
        private readonly ConcurrentDictionary<int, int> _onlineCustomers = new();

        public bool MarkConnected(int customerId)
        {
            var count = _onlineCustomers.AddOrUpdate(customerId, 1, (_, c) => c + 1);
            return count == 1;
        }

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
