let disconnectFn = null

/**
 * Hàm registerChatDisconnect: thực thi chức năng xử lý của module
 */
export function registerChatDisconnect(fn) {
  disconnectFn = fn
}

/**
 * Hàm disconnectChat: thực thi chức năng xử lý của module
 */
export function disconnectChat() {
  disconnectFn?.()
}
