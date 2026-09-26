import { create } from 'zustand'

const reconnectListeners = new Set()

/**
 * Zustand store theo dõi trạng thái kết nối mạng trực tuyến/ngoại tuyến
 */
export const useNetworkStore = create((set) => {
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      set({ isOnline: true })
      reconnectListeners.forEach((cb) => {
        try {
          cb()
        } catch {}
      })
    })

    window.addEventListener('offline', () => {
      set({ isOnline: false })
    })
  }

  return {
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine !== false : true,
    setOnline: (isOnline) => set({ isOnline }),
    onReconnect: (cb) => {
      reconnectListeners.add(cb)
      return () => reconnectListeners.delete(cb)
    },
  }
})

/**
 * Hook tương thích ngược cho các component đang sử dụng useNetwork()
 */
export function useNetwork() {
  const isOnline = useNetworkStore((s) => s.isOnline)
  const onReconnect = useNetworkStore((s) => s.onReconnect)

  return {
    isOnline,
    onReconnect,
  }
}
