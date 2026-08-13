import { useEffect, useState } from 'react'
import Toast from 'react-native-toast-message'
import { authService } from '../services/authService'
import { chatService } from '../services/chatService'
import { AuthContext } from './auth-context'

const GUEST_USER = { username: 'guest', fullName: 'Khách' }

export function AuthProvider({ children }) {
  const [user, setUser] = useState(GUEST_USER)
  // Trong lúc chờ xác nhận phiên đăng nhập từ server, coi như khách để màn hình
  // chính hiện ngay không cần chờ mạng (giống hành vi web).
  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    authService.me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setRestoring(false))
  }, [])

  const login = (userData) => setUser(userData)

  const logout = () => {
    authService.logout().catch(() => {})
    chatService.disconnect()
    setUser(GUEST_USER)
    Toast.show({ type: 'success', text1: 'Đã đăng xuất' })
  }

  return (
    <AuthContext.Provider value={{ user, restoring, isGuest: user.username === 'guest', login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
