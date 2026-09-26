import { create } from 'zustand'
import NetInfo from '@react-native-community/netinfo'

const reconnectListeners = new Set()
let wasOffline = false

/**
 * Zustand store theo dõi mạng trên ứng dụng di động
 */
export const useNetworkStore = create((set) => {
  NetInfo.addEventListener((state) => {
    const offline = state.isConnected === false || state.isInternetReachable === false
    set({ isOnline: !offline })

    if (offline) {
      wasOffline = true
    } else if (wasOffline) {
      wasOffline = false
      reconnectListeners.forEach((cb) => {
        try {
          cb()
        } catch {}
      })
    }
  })

  return {
    isOnline: true,
    setOnline: (isOnline) => set({ isOnline }),
    onReconnect: (cb) => {
      reconnectListeners.add(cb)
      return () => reconnectListeners.delete(cb)
    },
  }
})

/**
 * Hook tương thích ngược useNetwork() cho mobile
 */
export function useNetwork() {
  const isOnline = useNetworkStore((s) => s.isOnline)
  const onReconnect = useNetworkStore((s) => s.onReconnect)

  return {
    isOnline,
    onReconnect,
  }
}
