import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { NetworkContext } from './network-context'

// Một chỗ duy nhất theo dõi trạng thái mạng cho cả app. Trước đây chỉ có
// OfflineBanner tự lắng nghe NetInfo và cũng chỉ để hiện banner; giờ các màn
// hình khác dùng chung để (1) chặn thao tác ghi khi mất sóng và (2) tự tải lại
// dữ liệu ngay khi có mạng trở lại.
export function NetworkProvider({ children }) {
  // Khởi tạo là true: trước khi NetInfo trả kết quả đầu tiên, coi như có mạng
  // để không chớp banner "mất kết nối" mỗi lần mở app.
  const [isOnline, setIsOnline] = useState(true)

  // Các hàm đăng ký "khi có mạng lại thì chạy" — dùng ref để việc đăng ký/huỷ
  // không làm context value đổi và kéo theo re-render toàn app.
  const reconnectListeners = useRef(new Set())
  const wasOffline = useRef(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      // NetInfo báo cả trạng thái "có kết nối nhưng không ra được Internet"
      // (isInternetReachable === false), nên chỉ coi là offline khi một trong
      // hai cờ rõ ràng là false — null nghĩa là chưa xác định được.
      const offline = state.isConnected === false || state.isInternetReachable === false
      setIsOnline(!offline)

      if (offline) {
        wasOffline.current = true
      } else if (wasOffline.current) {
        wasOffline.current = false
        reconnectListeners.current.forEach((cb) => {
          try {
            cb()
          } catch {
            // Một listener lỗi không được chặn các listener còn lại.
          }
        })
      }
    })
    return unsubscribe
  }, [])

  /**
   * Đăng ký hàm chạy mỗi khi mạng vừa được khôi phục (không chạy ở lần xác định
   * trạng thái đầu tiên).
   * @returns {() => void} hàm huỷ đăng ký
   */
  const onReconnect = useCallback((cb) => {
    reconnectListeners.current.add(cb)
    return () => reconnectListeners.current.delete(cb)
  }, [])

  const value = useMemo(() => ({ isOnline, onReconnect }), [isOnline, onReconnect])

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}
