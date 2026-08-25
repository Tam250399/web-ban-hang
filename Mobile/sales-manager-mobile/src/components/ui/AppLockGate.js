import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../../context/auth-context'
import { authenticateBiometric } from '../../services/biometricAuth'
import { brand } from '../../theme/colors'
import { fonts } from '../../theme/fonts'
import { Icon } from './Icon'

// ────────────────────────────────────────────────────────────────────────────
// Khoá ứng dụng bằng sinh trắc học.
//
// Vì sao cần: backend giữ phiên trong cookie HttpOnly nằm ở native cookie jar,
// nên cookie còn hạn thì mở app lên là đã đăng nhập sẵn. Trước đây nút "đăng
// nhập bằng vân tay" chỉ gọi lại /auth/me sau khi quét — tức là ai cầm máy cũng
// vào thẳng được, quét vân tay hay không cũng vậy. Lớp khoá này mới là thứ thực
// sự chặn: phải xác thực thì mới thấy được nội dung.
//
// Chỉ bật khi người dùng đã tự bật công tắc sinh trắc học trong màn Tài khoản.
// ────────────────────────────────────────────────────────────────────────────
export default function AppLockGate() {
  const {
    isGuest, restoring, logout,
    biometricEnabled, biometricReady, biometricLabel,
  } = useAuth()

  const shouldGuard = biometricEnabled && !isGuest

  const [locked, setLocked] = useState(false)
  // Tấm che riêng cho lúc app rời khỏi tiền cảnh: hệ điều hành chụp ảnh màn hình
  // để hiện trong trình chuyển ứng dụng, và ảnh đó sẽ lộ doanh thu/đơn hàng nếu
  // không che kịp. Che ngay ở trạng thái 'inactive' chứ không đợi 'background'.
  const [shielded, setShielded] = useState(false)
  const [authenticating, setAuthenticating] = useState(false)
  const [failed, setFailed] = useState(false)
  // Theo dõi app có đang ở tiền cảnh không: không thể hỏi vân tay khi app còn
  // trong nền, mà lúc quay lại thì `locked` đã bật sẵn từ trước nên không có
  // chuyển trạng thái nào để bám vào. Ghép hai giá trị này mới đủ.
  const [appActive, setAppActive] = useState(AppState.currentState === 'active')

  const armed = useRef(false)

  // ── Khoá ngay ở lần mở app đầu tiên ──
  // Chờ cả phiên đăng nhập lẫn cờ sinh trắc học nạp xong rồi mới quyết định,
  // nếu không sẽ đọc nhầm giá trị mặc định và bỏ qua màn khoá.
  useEffect(() => {
    if (restoring || !biometricReady || armed.current) return
    armed.current = true
    if (biometricEnabled && !isGuest) setLocked(true)
  }, [restoring, biometricReady, biometricEnabled, isGuest])

  // ── Khoá lại mỗi khi app quay về từ nền ──
  useEffect(() => {
    if (!shouldGuard) {
      setLocked(false)
      setShielded(false)
      return
    }

    const subscription = AppState.addEventListener('change', (next) => {
      if (next === 'inactive' || next === 'background') {
        setShielded(true)
        // Chỉ 'background' mới thực sự khoá. Trên iOS, kéo trung tâm thông báo
        // hay nhận cuộc gọi cũng đẩy app sang 'inactive' trong chốc lát — bắt
        // quét vân tay lại ở những lúc đó thì quá phiền mà chẳng thêm an toàn.
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
      // disableDeviceFallback: false trong biometricAuth nghĩa là người dùng vẫn
      // mở được bằng mã khoá màn hình khi vân tay không đọc ra (tay ướt, băng
      // dán...) — không để họ bị nhốt ngoài app.
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

  // Tự hỏi vân tay ngay khi màn khoá hiện ra và app đang ở tiền cảnh, để trường
  // hợp thường gặp nhất chỉ tốn một lần chạm chứ không phải bấm nút rồi mới quét.
  // Bám vào cả hai giá trị nên chạy đúng ở cả hai tình huống: mở app từ đầu
  // (locked bật lên khi app đã active) và quay lại từ nền (locked đã bật sẵn,
  // appActive mới là cái đổi).
  //
  // Nếu người dùng bấm huỷ thì `failed` bật lên nhưng locked/appActive không
  // đổi, nên effect không chạy lại — không có chuyện hỏi vân tay liên tục.
  useEffect(() => {
    if (locked && appActive) unlock()
    // unlock cố tình không nằm trong deps: nó đổi theo `authenticating` nên đưa
    // vào sẽ tạo vòng lặp gọi lại chính nó.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locked, appActive])

  const handleLogout = useCallback(() => {
    // Lối thoát khi không xác thực được bằng cách nào: về trạng thái khách và
    // đăng nhập lại bằng mật khẩu. logout() đặt isGuest = true nên shouldGuard
    // thành false và lớp khoá tự gỡ.
    logout()
    setLocked(false)
    setFailed(false)
  }, [logout])

  if (!locked && !(shielded && shouldGuard)) return null

  return (
    <View style={styles.overlay}>
      <LinearGradient colors={['#0F172A', '#1E293B']} style={StyleSheet.absoluteFill} />

      {/* Lúc chỉ đang che ảnh xem trước thì không hiện nút bấm — người dùng
          không nhìn thấy màn này, mà hiện ra lại chớp một nhịp khi quay lại. */}
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
