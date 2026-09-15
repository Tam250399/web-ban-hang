import * as signalR from '@microsoft/signalr'
import { request } from './apiClient'
import { HUB_URL } from './config'

const CHAT = '/chat'

let connection = null
let startPromise = null

const stateListeners = new Set()

/**
 * Hàm emitState: thực thi chức năng xử lý của module
 */
function emitState(connected) {
  stateListeners.forEach((cb) => cb(connected))
}

/**
 * Hàm lấy dữ liệu getConnection
 */
function getConnection() {
  if (!connection) {
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

  connect() {
    const conn = getConnection()
    if (conn.state === signalR.HubConnectionState.Connected) return Promise.resolve()
    if (!startPromise) {
      startPromise = conn.start()
        .then(() => emitState(true))
        .catch((err) => {
          startPromise = null
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
