import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { useNetwork } from '../context/network-context'

/**
 * Chặn các thao tác GHI khi đang mất mạng.
 *
 * Trước đây bấm "Đặt hàng" lúc không có mạng thì request chạy tới khi hết hạn
 * 15s mới báo một lỗi chung chung — người dùng không biết là do mạng và thường
 * bấm lại nhiều lần. Kiểm tra trước cho phản hồi tức thì và đúng nguyên nhân.
 *
 * Chỉ dùng cho thao tác ghi: thao tác đọc vẫn nên thử gọi (biết đâu navigator
 * .onLine báo sai) và đã có cache đỡ phía sau.
 *
 * @returns {(action?: string) => boolean} true nếu được phép chạy tiếp
 */
export function useRequireOnline() {
  const { isOnline } = useNetwork()

  return useCallback((action = 'Thao tác này') => {
    if (isOnline) return true
    toast.error(`${action} cần có mạng. Vui lòng thử lại khi đã kết nối.`)
    return false
  }, [isOnline])
}
