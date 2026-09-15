import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

/**
 * Hook truy xuất trạng thái người dùng và thông tin xác thực từ AuthContext
 */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
