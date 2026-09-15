let disconnectFn = null

export function registerChatDisconnect(fn) {
  disconnectFn = fn
}

export function disconnectChat() {
  disconnectFn?.()
}
