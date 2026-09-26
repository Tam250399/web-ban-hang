import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'
import { authService } from '../services/authService'
import { chatService } from '../services/chatService'
import { setUnauthorizedHandler } from '../services/apiClient'
import { clearAllCache } from '../services/cache'
import { isBiometricAvailable, getBiometricLabel, authenticateBiometric } from '../services/biometricAuth'

export const GUEST_USER = { username: 'guest', fullName: 'Khách' }
export const BIOMETRIC_STORAGE_KEY = 'salesManagerBiometricEnabled'

/**
 * Zustand store quản lý xác thực và sinh trắc học trên thiết bị di động
 */
export const useAuthStore = create((set, get) => ({
  user: GUEST_USER,
  restoring: true,
  biometricSupported: false,
  biometricLabel: 'sinh trắc học',
  biometricEnabled: false,
  biometricReady: false,

  isGuest: () => get().user?.username === 'guest',

  login: (userData) => set({ user: userData }),

  enableBiometricLogin: async () => {
    const label = get().biometricLabel
    const ok = await authenticateBiometric(`Xác nhận để bật đăng nhập bằng ${label}`)
    if (!ok) return false
    await AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, 'true')
    set({ biometricEnabled: true })
    return true
  },

  disableBiometricLogin: async () => {
    await AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, 'false')
    set({ biometricEnabled: false })
  },

  logout: () => {
    authService.logout().catch(() => {})
    chatService.disconnect()
    clearAllCache()
    set({ user: GUEST_USER })
    get().disableBiometricLogin()
    Toast.show({ type: 'success', text1: 'Đã đăng xuất' })
  },

  loginWithBiometric: async () => {
    const label = get().biometricLabel
    const ok = await authenticateBiometric(`Đăng nhập bằng ${label}`)
    if (!ok) return false
    try {
      const data = await authService.me()
      set({ user: data })
      return true
    } catch {
      Toast.show({ type: 'error', text1: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại bằng mật khẩu.' })
      return false
    }
  },

  initialize: async () => {
    try {
      const mePromise = authService.me()
        .then((data) => set({ user: data }))
        .catch(() => {})
        .finally(() => set({ restoring: false }))

      const bioAvailPromise = isBiometricAvailable().then((supported) => set({ biometricSupported: supported }))
      const bioLabelPromise = getBiometricLabel().then((label) => set({ biometricLabel: label }))
      const bioKeyPromise = AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY)
        .then((v) => set({ biometricEnabled: v === 'true' }))
        .catch(() => {})
        .finally(() => set({ biometricReady: true }))

      await Promise.all([mePromise, bioAvailPromise, bioLabelPromise, bioKeyPromise])
    } catch {}
  },
}))

// Cấu hình bắt lỗi 401 Unauthorized tập trung
setUnauthorizedHandler(() => {
  const currentUser = useAuthStore.getState().user
  if (currentUser?.username === 'guest') return
  useAuthStore.setState({ user: GUEST_USER, biometricEnabled: false })
  chatService.disconnect()
  clearAllCache()
  AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, 'false').catch(() => {})
  Toast.show({ type: 'error', text1: 'Phiên đăng nhập đã hết hạn', text2: 'Vui lòng đăng nhập lại.' })
})

// Khởi chạy đồng bộ thông tin tài khoản
useAuthStore.getState().initialize()

/**
 * Hook tương thích ngược cho mobile
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user)
  const restoring = useAuthStore((s) => s.restoring)
  const biometricSupported = useAuthStore((s) => s.biometricSupported)
  const biometricLabel = useAuthStore((s) => s.biometricLabel)
  const biometricEnabled = useAuthStore((s) => s.biometricEnabled)
  const biometricReady = useAuthStore((s) => s.biometricReady)
  const login = useAuthStore((s) => s.login)
  const logout = useAuthStore((s) => s.logout)
  const enableBiometricLogin = useAuthStore((s) => s.enableBiometricLogin)
  const disableBiometricLogin = useAuthStore((s) => s.disableBiometricLogin)
  const loginWithBiometric = useAuthStore((s) => s.loginWithBiometric)

  return {
    user,
    restoring,
    isGuest: user?.username === 'guest',
    login,
    logout,
    biometricSupported,
    biometricLabel,
    biometricEnabled,
    biometricReady,
    enableBiometricLogin,
    disableBiometricLogin,
    loginWithBiometric,
  }
}
