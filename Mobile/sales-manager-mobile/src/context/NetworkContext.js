import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import NetInfo from '@react-native-community/netinfo'
import { NetworkContext } from './network-context'

export function NetworkProvider({ children }) {
  const [isOnline, setIsOnline] = useState(true)

  const reconnectListeners = useRef(new Set())
  const wasOffline = useRef(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
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
          }
        })
      }
    })
    return unsubscribe
  }, [])

  const onReconnect = useCallback((cb) => {
    reconnectListeners.current.add(cb)
    return () => reconnectListeners.current.delete(cb)
  }, [])

  const value = useMemo(() => ({ isOnline, onReconnect }), [isOnline, onReconnect])

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}
