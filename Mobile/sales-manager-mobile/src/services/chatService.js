import * as signalR from '@microsoft/signalr'
import { request } from './apiClient'
import { HUB_URL } from './config'

const CHAT = '/chat'

let connection = null
let startPromise = null

// SignalR chỉ có onreconnecting/onreconnected/onclose để ĐĂNG KÝ, không có API
// gỡ callback. Trước đây hai màn chat gọi thẳng các hàm đó trong useEffect nên
// mỗi lần vào lại tab là tích thêm một bộ callback, không bao giờ được dọn.
// Ở đây gắn đúng một lần vào connection rồi phát lại cho các subscriber — screen
// đăng ký/huỷ qua Set này nên unmount là sạch.
const stateListeners = new Set()

function emitState(connected) {
  stateListeners.forEach((cb) => cb(connected))
}

function getConnection() {
  if (!connection) {
    // Ép dùng WebSockets thay vì để SignalR tự thương lượng transport fallback.
    // Tắt internal console.error log của SignalR (.configureLogging(signalR.LogLevel.None))
    // để không làm nổ màn hình đỏ LogBox khi chưa đăng nhập hoặc session hết hạn (401).
    connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { transport: signalR.HttpTransportType.WebSockets })
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect()
      .build()

    connection.onreconnecting(() => emitState(false))
    connection.onreconnected(() => emitState(true))
    connection.onclose(() => emitState(false))
  }
  return connection
}

export const chatService = {
  getMyConversation:       ()   => request(`${CHAT}/me`),
  getConversations:        ()   => request(`${CHAT}/conversations`),
  getConversationMessages: (id) => request(`${CHAT}/conversations/${id}/messages`),

  // Idempotent: nhiều lệnh gọi chồng nhau đều dùng chung một promise start()
  // Xử lý êm 401 khi chưa đăng nhập để không bị văng lỗi.
  connect() {
    const conn = getConnection()
    if (conn.state === signalR.HubConnectionState.Connected) return Promise.resolve()
    if (!startPromise) {
      startPromise = conn.start()
        .then(() => emitState(true))
        .catch((err) => {
          startPromise = null
          // Bỏ qua lỗi 401 (chưa đăng nhập / hết hạn session)
          if (err?.message?.includes('401') || err?.toString?.()?.includes('401')) {
            return Promise.resolve()
          }
          throw err
        })
    }
    return startPromise
  },
  disconnect() {
    if (connection) {
      connection.stop().catch(() => {})
      connection = null
      startPromise = null
      emitState(false)
    }
  },

  on:  (event, cb) => getConnection().on(event, cb),
  off: (event, cb) => { if (connection) connection.off(event, cb) },

  /**
   * Theo dõi trạng thái kết nối để UI hiện banner "đang kết nối lại".
   * @param {(connected: boolean) => void} cb
   * @returns {() => void} hàm huỷ đăng ký — nhớ gọi trong cleanup của useEffect.
   */
  onConnectionChange(cb) {
    stateListeners.add(cb)
    return () => stateListeners.delete(cb)
  },

  isConnected: () => connection?.state === signalR.HubConnectionState.Connected,

  sendMessage:          (content, imageUrl = null)                  => getConnection().invoke('SendMessage', content, imageUrl),
  replyToConversation:  (conversationId, content, imageUrl = null)   => getConnection().invoke('ReplyToConversation', conversationId, content, imageUrl),
  joinConversation:     (conversationId)     => getConnection().invoke('JoinConversation', conversationId),
  leaveConversation:    (conversationId)     => getConnection().invoke('LeaveConversation', conversationId),
  markRead:             ()                   => getConnection().invoke('MarkRead'),
}
