import * as signalR from '@microsoft/signalr'
import { BASE_URL, request } from './apiClient'

const CHAT = `${BASE_URL}/chat`
const HUB_URL = '/chathub'

let connection = null
let startPromise = null

function getConnection() {
  if (!connection) {
    // Không truyền accessTokenFactory: cookie access_token (HttpOnly) tự động được gửi
    // kèm cùng-origin (withCredentials mặc định = true của SignalR client).
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL)
      .withAutomaticReconnect()
      .build()
  }
  return connection
}

export const chatService = {
  getMyConversation:       ()   => request(`${CHAT}/me`),
  getConversations:        ()   => request(`${CHAT}/conversations`),
  getConversationMessages: (id) => request(`${CHAT}/conversations/${id}/messages`),

  // Idempotent: nhiều lệnh gọi chồng nhau (vd. React StrictMode chạy effect 2 lần)
  // đều dùng chung một promise start() thay vì gọi conn.start() song song, vì
  // SignalR sẽ ném lỗi nếu start() được gọi lúc connection đang ở trạng thái "Connecting".
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
