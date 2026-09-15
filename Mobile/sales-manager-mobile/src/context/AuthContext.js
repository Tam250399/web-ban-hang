import { useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Toast from 'react-native-toast-message'
import { authService } from '../services/authService'
import { chatService } from '../services/chatService'
import { setUnauthorizedHandler } from '../services/apiClient'
import { clearAllCache } from '../services/cache'
import { isBiometricAvailable, getBiometricLabel, authenticateBiometric } from '../services/biometricAuth'
import { AuthContext } from './auth-context'

const GUEST_USER = { username: 'guest', fullName: 'Khách' }
const BIOMETRIC_STORAGE_KEY = 'salesManagerBiometricEnabled'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(GUEST_USER)
  const [restoring, setRestoring] = useState(true)
  const [biometricSupported, setBiometricSupported] = useState(false)
  const [biometricLabel, setBiometricLabel] = useState('sinh trắc học')
  const [biometricEnabled, setBiometricEnabled] = useState(false)
  const [biometricReady, setBiometricReady] = useState(false)

  useEffect(() => {
    authService.me()
      .then(setUser)
      .catch(() => {})
      .finally(() => setRestoring(false))

    isBiometricAvailable().then(setBiometricSupported)
    getBiometricLabel().then(setBiometricLabel)
    AsyncStorage.getItem(BIOMETRIC_STORAGE_KEY)
      .then((v) => setBiometricEnabled(v === 'true'))
      .catch(() => {})
      .finally(() => setBiometricReady(true))
  }, [])

  const userRef = useRef(user)
  userRef.current = user

  useEffect(() => {
    setUnauthorizedHandler(() => {
      if (userRef.current.username === 'guest') return
      setUser(GUEST_USER)
      chatService.disconnect()
      clearAllCache()
      AsyncStorage.setItem(BIOMETRIC_STORAGE_KEY, 'false').catch(() => {})
      setBiometricEnabled(false)
      Toast.show({ type: 'error', text1: 'Phiên đăng nhập đã hết hạn', text2: 'Vui lòng đăng nhập lại.' })
    })
    return () => setUnauthorizedHandler(null)
  }, [])

  const login = (userData) => setUser(userData)

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
    clearAllCache()
    setUser(GUEST_USER)
    disableBiometricLogin()
    Toast.show({ type: 'success', text1: 'Đã đăng xuất' })
  }

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
        biometricReady,
        enableBiometricLogin,
        disableBiometricLogin,
        loginWithBiometric,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
