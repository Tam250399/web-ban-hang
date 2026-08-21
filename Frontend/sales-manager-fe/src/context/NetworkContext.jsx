import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NetworkContext } from './network-context'

// Một chỗ duy nhất theo dõi trạng thái mạng cho cả app: hiện banner, chặn thao
// tác ghi khi mất sóng, và tự tải lại dữ liệu ngay khi có mạng trở lại.
export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine !== false)

  // Danh sách hàm "khi có mạng lại thì chạy" — giữ trong ref để việc đăng
  // ký/huỷ không làm context value đổi và kéo theo re-render toàn app.
  const reconnectListeners = useRef(new Set())

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      reconnectListeners.current.forEach((cb) => {
        try {
          cb()
        } catch {
          // Một listener lỗi không được chặn các listener còn lại.
        }
      })
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  /**
   * @returns {() => void} hàm huỷ đăng ký
   */
  const onReconnect = useCallback((cb) => {
    reconnectListeners.current.add(cb)
    return () => reconnectListeners.current.delete(cb)
  }, [])

  const value = useMemo(() => ({ isOnline, onReconnect }), [isOnline, onReconnect])

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}
