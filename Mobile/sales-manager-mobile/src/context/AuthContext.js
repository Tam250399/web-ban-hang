import { useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'
import { authService } from '../services/authService'
import { chatService } from '../services/chatService'
import { isBiometricAvailable, getBiometricLabel, authenticateBiometric } from '../services/biometricAuth'
import { AuthContext } from './auth-context'

const GUEST_USER = { username: 'guest', fullName: 'Khách' }
const BIOMETRIC_STORAGE_KEY = 'salesManagerBiometricEnabled'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(GUEST_USER)
  // Trong lúc chờ xác nhận phiên đăng nhập từ server, coi như khách để màn hình
  // chính hiện ngay không cần chờ mạng (giống hành vi web).
  const [restoring, setRestoring] = useState(true)
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [biometricLabel, setBiometricLabel] = useState('sinh trắc học')
  const [biometricEnabled, setBiometricEnabled] = useState(false)

  useEffect(() => {
    authService.me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setRestoring(false))

    isBiometricAvailable().then(setBiometricSupported)
    getBiometricLabel().then(setBiometricLabel)
    AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY).then((v) => setBiometricEnabled(v === 'true'))
  }, [])

  const login = (userData) => setUser(userData)

  // Chỉ bật được sau khi xác thực sinh trắc học thành công một lần, để chắc
  // chắn thiết bị thực sự đọc được vân tay/khuôn mặt trước khi ghi cờ bật.
  const enableBiometricLogin = async () => {
    const ok = await authenticateBiometric(`Xác nhận để bật đăng nhập bằng ${biometricLabel}`)
    if (!ok) return false
    await AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, 'true')
    setBiometricEnabled(true)
    return true
  }

  const disableBiometricLogin = async () => {
    await AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, 'false')
    setBiometricEnabled(false)
  }

  const logout = () => {
    authService.logout().catch(() => {})
    chatService.disconnect()
    setUser(GUEST_USER)
    // Đăng xuất huỷ hẳn cookie phiên trên server, nên "mở khóa bằng sinh trắc
    // học" không còn gì để mở khóa nữa — tắt luôn cờ để nút này không hiện lại
    // và báo "hết hạn" gây nhầm lẫn ở lần đăng nhập kế tiếp.
    disableBiometricLogin()
    Toast.show({ type: 'success', text1: 'Đã đăng xuất' })
  }

  // Backend dùng cookie HttpOnly (không có refresh token riêng), nên sinh trắc
  // học ở đây đóng vai trò "mở khóa" phiên đăng nhập vẫn còn hiệu lực trong
  // cookie — chứ không tự tạo phiên mới. Nếu cookie đã hết hạn, phải quay lại
  // đăng nhập bằng mật khẩu như bình thường.
  const loginWithBiometric = async () => {
    const ok = await authenticateBiometric(`Đăng nhập bằng ${biometricLabel}`)
    if (!ok) return false
    try {
      const data = await authService.me()
      setUser(data)
      return true
    } catch {
      Toast.show({ type: 'error', text1: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại bằng mật khẩu.' })
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        restoring,
        isGuest: user.username === 'guest',
        login,
        logout,
        biometricSupported,
        biometricLabel,
        biometricEnabled,
        enableBiometricLogin,
        disableBiometricLogin,
        loginWithBiometric,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
