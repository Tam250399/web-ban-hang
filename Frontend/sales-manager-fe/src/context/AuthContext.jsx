import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'
import { setUnauthorizedHandler } from '../services/apiClient'
import { disconnectChat } from '../services/chatSession'
import { clearAllCache } from '../services/cache'
import { AuthContext } from './auth-context'

const GUEST_USER = { username: 'guest', fullName: 'Khách' }
const USER_STORAGE_KEY = 'salesManagerUser'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(GUEST_USER)

  const [restoring, setRestoring] = useState(true)

  useEffect(() => {
    authService.me()
      .then((data) => {
        setUser(data)
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data))
      })
      .catch(() => {
        localStorage.removeItem(USER_STORAGE_KEY)
      })
      .finally(() => setRestoring(false))
  }, [])

  const login = useCallback((userData) => {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
    setUser(userData)
  }, [])

  const logout = useCallback(() => {
    authService.logout().catch(() => {})
    localStorage.removeItem(USER_STORAGE_KEY)
    disconnectChat()
    clearAllCache()
    setUser(GUEST_USER)
    toast.success('Đã đăng xuất')
  }, [])

  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (userRef.current?.username === 'guest') return
      localStorage.removeItem(USER_STORAGE_KEY)
      disconnectChat()
      clearAllCache()
      setUser(GUEST_USER)
      setSessionExpired(true)
      toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const value = useMemo(() => ({
    user,
    restoring,
    sessionExpired,
    clearSessionExpired: () => setSessionExpired(false),
    isAdmin: user?.role === 'Admin',
    isLoggedIn: !!user && user.username !== 'guest',
    login,
    logout,
  }), [user, restoring, sessionExpired, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
