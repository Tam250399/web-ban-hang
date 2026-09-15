import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NetworkContext } from './network-context'

/**
 * Provider theo dõi trạng thái kết nối mạng trực tuyến/ngoại tuyến của trình duyệt
 */
export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(() => navigator.onLine !== false)

  const reconnectListeners = useRef(new Set())

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      reconnectListeners.current.forEach((cb) => {
        try {
          cb()
        } catch {
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

  const onReconnect = useCallback((cb) => {
    reconnectListeners.current.add(cb)
    return () => reconnectListeners.current.delete(cb)
  }, [])

  const value = useMemo(() => ({ isOnline, onReconnect }), [isOnline, onReconnect])

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}
