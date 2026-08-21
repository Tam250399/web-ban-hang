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
  // Mặc định là khách để trang chủ hiện ngay không cần chờ mạng; nếu có phiên
  // đăng nhập hợp lệ (cookie HttpOnly), state được nâng cấp sau khi server xác nhận.
  const [user, setUser] = useState(GUEST_USER)

  // restoring = đang hỏi /auth/me. Các route được bảo vệ BẮT BUỘC phải chờ cờ
  // này: nếu không, admin bấm F5 ở /quan-tri sẽ bị đá về trang chủ trong tích
  // tắc trước khi server kịp xác nhận phiên.
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
    // Xoá dữ liệu đã lưu offline: máy ở cửa hàng thường dùng chung, người đăng
    // nhập sau không được thấy đơn hàng của người trước.
    clearAllCache()
    setUser(GUEST_USER)
    toast.success('Đã đăng xuất')
  }, [])

  // ── Xử lý 401 tập trung ──
  // Đọc user qua ref để handler chỉ đăng ký một lần thay vì gỡ/gắn lại mỗi khi
  // user đổi.
  const userRef = useRef(user)
  useEffect(() => { userRef.current = user }, [user])

  // Route guard đọc cờ này để biết cần đẩy về màn đăng nhập.
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    setUnauthorizedHandler(() => {
      // Khách chưa đăng nhập gọi API cần quyền là chuyện bình thường — không
      // việc gì phải báo "hết hạn".
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
