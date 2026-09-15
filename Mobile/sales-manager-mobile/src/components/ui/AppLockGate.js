import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../context/auth-context'
import { authenticateBiometric } from '../../services/biometricAuth'
import { brand } from '../../theme/colors'
import { fonts } from '../../theme/fonts'
import { Icon } from './Icon'

/**
 * Component AppLockGate
 */
export default function AppLockGate() {
  const {
    isGuest, restoring, logout,
    biometricEnabled, biometricReady, biometricLabel,
  } = useAuth()

  const shouldGuard = biometricEnabled && !isGuest

  const [locked, setLocked] = useState(false)
  const [shielded, setShielded] = useState(false)
  const [authenticating, setAuthenticating] = useState(false)
  const [failed, setFailed] = useState(false)
  const [appActive, setAppActive] = useState(AppState.currentState === 'active')

  const armed = useRef(false)

  useEffect(() => {
    if (restoring || !biometricReady || armed.current) return
    armed.current = true
    if (biometricEnabled && !isGuest) setLocked(true)
  }, [restoring, biometricReady, biometricEnabled, isGuest])

  useEffect(() => {
    if (!shouldGuard) {
      setLocked(false)
      setShielded(false)
      return
    }

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'inactive' || next === 'background') {
        setShielded(true)
        setAppActive(false)
        if (next === 'background') {
          setLocked(true)
          setFailed(false)
        }
      } else if (next === 'active') {
        setShielded(false)
        setAppActive(true)
      }
    })

    return () => subscription.remove()
  }, [shouldGuard])

  const unlock = useCallback(async () => {
    if (authenticating) return
    setAuthenticating(true)
    try {
      const ok = await authenticateBiometric('Mở khoá để tiếp tục')
      if (ok) {
        setLocked(false)
        setFailed(false)
      } else {
        setFailed(true)
      }
    } catch {
      setFailed(true)
    } finally {
      setAuthenticating(false)
    }
  }, [authenticating])

  useEffect(() => {
    if (locked && appActive) unlock()
  }, [locked, appActive])

  const handleLogout = useCallback(() => {
    logout()
    setLocked(false)
    setFailed(false)
  }, [logout])

  if (!locked && !(shielded && shouldGuard)) return null

  return (
    <View style={styles.overlay}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={StyleSheet.absoluteFill} />

      {locked && (
        <View style={styles.content}>
          <LinearGradient colors={['#EA580C', '#F97316']} style={styles.logo}>
            <Icon name="lock" size={30} color={brand.white} />
          </LinearGradient>

          <Text style={styles.title}>Đã khoá</Text>
          <Text style={styles.subtitle}>
            Xác thực bằng {biometricLabel} để mở lại ứng dụng.
          </Text>

          {failed && (
            <Text style={styles.failedText}>
              Chưa xác thực được. Bạn có thể thử lại hoặc đăng xuất để vào bằng mật khẩu.
            </Text>
          )}

          <TouchableOpacity
            style={[styles.unlockBtn, authenticating && styles.unlockBtnDisabled]}
            onPress={unlock}
            disabled={authenticating}
            activeOpacity={0.85}
          >
            {authenticating ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.unlockText}>Mở khoá bằng {biometricLabel}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 9999, elevation: 9999 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 12 },
  logo: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  title: { fontFamily: fonts.displayExtraBold, fontSize: 28, color: '#FFFFFF' },
  subtitle: {
    fontFamily: fonts.body, fontSize: 15, lineHeight: 22,
    color: '#94A3B8', textAlign: 'center', marginBottom: 10,
  },
  failedText: {
    fontFamily: fonts.bodyMedium, fontSize: 13.5, lineHeight: 20,
    color: '#FCA5A5', textAlign: 'center', marginBottom: 4,
  },
  unlockBtn: {
    width: '100%', minHeight: 52, borderRadius: 14,
    backgroundColor: brand.primary, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20,
  },
  unlockBtnDisabled: { opacity: 0.7 },
  unlockText: { color: '#FFFFFF', fontFamily: fonts.displayBold, fontSize: 17 },
  logoutBtn: { paddingVertical: 12, paddingHorizontal: 20 },
  logoutText: { color: '#94A3B8', fontFamily: fonts.bodyBold, fontSize: 15 },
})
