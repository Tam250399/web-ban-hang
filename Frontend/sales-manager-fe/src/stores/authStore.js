import { create } from 'zustand'
import toast from 'react-hot-toast'
import { authService } from '../services/authService'
import { setUnauthorizedHandler } from '../services/apiClient'
import { disconnectChat } from '../services/chatSession'
import { clearAllCache } from '../services/cache'

export const GUEST_USER = { username: 'guest', fullName: 'Khách' }
export const USER_STORAGE_KEY = 'salesManagerUser'

function getInitialUser() {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY)
    return raw ? JSON.parse(raw) : GUEST_USER
  } catch {
    return GUEST_USER
  }
}

/**
 * Zustand store quản lý trạng thái xác thực và tài khoản người dùng
 */
export const useAuthStore = create((set, get) => ({
  user: getInitialUser(),
  restoring: true,
  sessionExpired: false,

  // Computed getters / helpers
  isAdmin: () => get().user?.role === 'Admin',
  isLoggedIn: () => {
    const user = get().user
    return !!user && user.username !== 'guest'
  },

  clearSessionExpired: () => set({ sessionExpired: false }),

  setUser: (userData) => {
    try {
      if (userData && userData.username !== 'guest') {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
      } else {
        localStorage.removeItem(USER_STORAGE_KEY)
      }
    } catch {}
    set({ user: userData || GUEST_USER })
  },

  login: (userData) => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData))
    } catch {}
    set({ user: userData, sessionExpired: false })
  },

  logout: async () => {
    try {
      await authService.logout().catch(() => {})
    } finally {
      localStorage.removeItem(USER_STORAGE_KEY)
      disconnectChat()
      clearAllCache()
      set({ user: GUEST_USER })
      toast.success('Đã đăng xuất')
    }
  },

  initialize: async () => {
    try {
      const data = await authService.me()
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data))
      set({ user: data })
    } catch {
      localStorage.removeItem(USER_STORAGE_KEY)
      set({ user: GUEST_USER })
    } finally {
      set({ restoring: false })
    }
  },
}))

// Đăng ký bộ xử lý lỗi 401 tập trung ngoài vòng đời React Component
setUnauthorizedHandler(() => {
  const currentUser = useAuthStore.getState().user
  if (!currentUser || currentUser.username === 'guest') return
  localStorage.removeItem(USER_STORAGE_KEY)
  disconnectChat()
  clearAllCache()
  useAuthStore.setState({ user: GUEST_USER, sessionExpired: true })
  toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
})

// Tự động kiểm tra phiên đăng nhập ngay khi ứng dụng khởi chạy
useAuthStore.getState().initialize()

/**
 * Hook tương thích ngược cho các component đang sử dụng useAuth()
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const restoring = useAuthStore((s) => s.restoring)
  const sessionExpired = useAuthStore((s) => s.sessionExpired)
  const clearSessionExpired = useAuthStore((s) => s.clearSessionExpired)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)

  const isAdmin = user?.role === 'Admin'
  const isLoggedIn = !!user && user.username !== 'guest'

  return {
    user,
    restoring,
    sessionExpired,
    clearSessionExpired,
    isAdmin,
    isLoggedIn,
    login,
    logout,
  }
}
