import { createContext, useContext } from 'react'

export const NetworkContext = createContext(null)

/**
 * Hook truy xuất trạng thái kết nối mạng Internet hiện tại
 */
export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used within a NetworkProvider')
  return ctx
}
