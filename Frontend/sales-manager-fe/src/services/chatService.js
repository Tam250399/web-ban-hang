import * as signalR from '@microsoft/signalr'
import { BASE_URL, request } from './apiClient'
import { HUB_URL } from './config'
import { registerChatDisconnect } from './chatSession'

const CHAT = `${BASE_URL}/chat`

let connection = null
let startPromise = null

function getConnection() {
  if (!connection) {
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
      connection.stop().catch(() => {})
      connection = null
      startPromise = null
    }
  },

  on:  (event, cb) => getConnection().on(event, cb),
  off: (event, cb) => { if (connection) connection.off(event, cb) },

  sendMessage:          (content, imageUrl = null)                  => getConnection().invoke('SendMessage', content, imageUrl),
  replyToConversation:  (conversationId, content, imageUrl = null)   => getConnection().invoke('ReplyToConversation', conversationId, content, imageUrl),
  joinConversation:     (conversationId)     => getConnection().invoke('JoinConversation', conversationId),
  leaveConversation:    (conversationId)     => getConnection().invoke('LeaveConversation', conversationId),
  markRead:             ()                   => getConnection().invoke('MarkRead'),
}

registerChatDisconnect(() => chatService.disconnect())
