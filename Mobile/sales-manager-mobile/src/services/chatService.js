import * as signalR from '@microsoft/signalr'
import { request } from './apiClient'
import { HUB_URL } from './config'

const CHAT = '/chat'

let connection = null
let startPromise = null

function getConnection() {
  if (!connection) {
    // Ép dùng WebSockets thay vì để SignalR tự thương lượng transport: fallback
    // Server-Sent Events/Long Polling của SignalR dùng vài API chỉ có trên trình
    // duyệt (vd. document), không tồn tại trong môi trường React Native.
    // Cookie access_token (HttpOnly) vẫn tự động gửi kèm qua native cookie jar.
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { transport: signalR.HttpTransportType.WebSockets })
      .withAutomaticReconnect()
      .build()
  }
  return connection
}

export const chatService = {
  getMyConversation:       ()   => request(`${CHAT}/me`),
  getConversations:        ()   => request(`${CHAT}/conversations`),
  getConversationMessages: (id) => request(`${CHAT}/conversations/${id}/messages`),

  // Idempotent: nhiều lệnh gọi chồng nhau đều dùng chung một promise start() thay vì
  // gọi conn.start() song song, vì SignalR sẽ ném lỗi nếu start() đang ở trạng thái "Connecting".
  connect() {
    const conn = getConnection()
    if (conn.state === signalR.HubConnectionState.Connected) return Promise.resolve()
    if (!startPromise) {
      startPromise = conn.start().catch(err => { startPromise = null; throw err })
    }
    return startPromise
  },
  disconnect() {
    if (connection) {
      connection.stop()
      connection = null
      startPromise = null
    }
  },

  on:  (event, cb) => getConnection().on(event, cb),
  // Không dùng getConnection() ở đây: nếu disconnect() đã chạy trước (vd. logout),
  // gọi off() không nên tạo lại một connection mới chỉ để bỏ đăng ký handler.
  off: (event, cb) => { if (connection) connection.off(event, cb) },

  sendMessage:          (content, imageUrl = null)                  => getConnection().invoke('SendMessage', content, imageUrl),
  replyToConversation:  (conversationId, content, imageUrl = null)   => getConnection().invoke('ReplyToConversation', conversationId, content, imageUrl),
  joinConversation:     (conversationId)     => getConnection().invoke('JoinConversation', conversationId),
  leaveConversation:    (conversationId)     => getConnection().invoke('LeaveConversation', conversationId),
  markRead:             ()                   => getConnection().invoke('MarkRead'),
}
