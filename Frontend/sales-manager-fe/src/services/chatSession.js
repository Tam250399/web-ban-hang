// Cầu nối nhỏ để App.jsx ngắt kết nối chat khi đăng xuất / phiên hết hạn mà
// KHÔNG phải import tĩnh chatService — import đó kéo @microsoft/signalr (thư
// viện nặng nhất trong dự án) vào bundle chính, trong khi khách vãng lai và
// admin đều không dùng tới widget chat.
//
// chatService tự đăng ký vào đây khi module của nó được nạp. Nếu chưa từng nạp
// thì cũng chưa có kết nối nào để ngắt, nên no-op là đúng.
let disconnectFn = null

export function registerChatDisconnect(fn) {
  disconnectFn = fn
}

export function disconnectChat() {
  disconnectFn?.()
}
