import { useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Toast from 'react-native-toast-message'
import { authService } from '../services/authService'
import { useAuth } from '../context/auth-context'
import { useRequireOnline } from '../hooks/useRequireOnline'
import DarkAuthShell from '../components/ui/DarkAuthShell'
import FormField from '../components/ui/FormField'
import { EyeIcon, EyeOffIcon } from '../components/ui/icons'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'
import { Icon } from '../components/ui/Icon'

/**
 * Màn hình đăng nhập tài khoản trên di động
 * Hỗ trợ: Đăng nhập mật khẩu, Sinh trắc học, Đăng nhập Google/Facebook, và Bắt buộc 2FA cho Quản trị viên
 */
export default function LoginScreen({ navigation }) {
  const {
    login, biometricSupported, biometricLabel, biometricEnabled,
    enableBiometricLogin, loginWithBiometric,
  } = useAuth()
  const requireOnline = useRequireOnline()

  // Form states
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bioSubmitting, setBioSubmitting] = useState(false)

  // 2FA states (dành cho Admin)
  const [twoFactorData, setTwoFactorData] = useState(null) // { requires2Fa, tempToken, emailMasked, twoFactorMethod }
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [verifying2Fa, setVerifying2Fa] = useState(false)
  const [resendingOtp, setResendingOtp] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Đếm ngược gửi lại mã OTP (60s)
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((c) => c - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  const promptEnableBiometric = () => {
    if (!biometricSupported || biometricEnabled) return
    Alert.alert(
      `Khoá ứng dụng bằng ${biometricLabel}?`,
      `Ứng dụng sẽ tự khoá mỗi khi bạn thoát ra, và cần ${biometricLabel} để mở lại. `
      + 'Người khác cầm máy sẽ không xem được đơn hàng và doanh thu của bạn.',
      [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Bật ngay', onPress: () => enableBiometricLogin() },
      ]
    )
  }

  // Đăng nhập Username / Password
  const handleSubmit = async () => {
    let uErr = ''
    let pErr = ''
    if (!username.trim()) uErr = 'Vui lòng nhập tên đăng nhập'
    if (!password) pErr = 'Vui lòng nhập mật khẩu'

    setUsernameError(uErr)
    setPasswordError(pErr)
    if (uErr || pErr) return
    if (!requireOnline('Đăng nhập')) return

    setSubmitting(true)
    setFormError('')
    try {
      const data = await authService.login(username, password)

      // Nếu tài khoản là Admin yêu cầu xác thực 2 bước (2FA)
      if (data?.requires2Fa) {
        setTwoFactorData(data)
        setOtpCode('')
        setOtpError('')
        setCountdown(60)
        Toast.show({
          type: 'info',
          text1: 'Xác thực 2 bước (2FA)',
          text2: 'Tài khoản Quản trị yêu cầu mã xác thực để bảo vệ dữ liệu nội bộ.',
        })
        return
      }

      const user = data?.user || { username }
      Toast.show({ type: 'success', text1: `Xin chào ${user.fullName || user.username}` })
      login(user)
      navigation.navigate('Home')
      promptEnableBiometric()
    } catch (error) {
      setFormError(error.message || 'Không thể kết nối tới backend.')
    } finally {
      setSubmitting(false)
    }
  }

  // Đăng nhập Sinh trắc học (Vân tay / Face ID)
  const handleBiometricLogin = async () => {
    setBioSubmitting(true)
    try {
      const ok = await loginWithBiometric()
      if (ok) navigation.navigate('Home')
    } finally {
      setBioSubmitting(false)
    }
  }

  // Xác thực mã OTP 2FA cho Quản trị viên
  const handleVerify2Fa = async () => {
    const code = otpCode.trim()
    if (!code) {
      setOtpError('Vui lòng nhập mã OTP 6 chữ số')
      return
    }
    if (code.length < 6) {
      setOtpError('Mã OTP phải gồm đủ 6 chữ số')
      return
    }

    setVerifying2Fa(true)
    setOtpError('')
    try {
      const data = await authService.verify2Fa(twoFactorData.tempToken, code)
      const user = data?.user
      Toast.show({
        type: 'success',
        text1: 'Xác thực 2FA thành công!',
        text2: `Chào mừng Quản trị viên ${user?.fullName || user?.username}`,
      })
      login(user)
      setTwoFactorData(null)
      navigation.navigate('Home')
      promptEnableBiometric()
    } catch (error) {
      setOtpError(error.message || 'Mã xác thực không chính xác hoặc đã hết hạn.')
    } finally {
      setVerifying2Fa(false)
    }
  }

  // Yêu cầu gửi lại mã OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resendingOtp) return
    setResendingOtp(true)
    setOtpError('')
    try {
      const res = await authService.resend2Fa(twoFactorData.tempToken)
      Toast.show({
        type: 'success',
        text1: 'Đã gửi lại mã OTP',
        text2: res.message || 'Vui lòng kiểm tra email của bạn.',
      })
      setCountdown(60)
    } catch (error) {
      setOtpError(error.message || 'Không thể gửi lại mã OTP.')
    } finally {
      setResendingOtp(false)
    }
  }

  return (
    <DarkAuthShell>
      <View style={styles.card}>
        {/* ================= GIAO DIỆN 2FA CHO ADMIN ================= */}
        {twoFactorData ? (
          <View>
            <View style={styles.headerBlock}>
              <LinearGradient colors={['#D97706', '#B45309']} style={styles.shieldBadge}>
                <Icon name="shield" size={26} color="#FFFFFF" />
              </LinearGradient>
              <Text style={styles.title}>Xác thực 2 bước (2FA)</Text>
              <Text style={styles.subtitle}>Bảo vệ dữ liệu nội bộ dành riêng cho Quản trị viên</Text>
            </View>

            <View style={styles.securityNoticeBox}>
              <Icon name="lock" size={16} color="#B45309" />
              <Text style={styles.securityNoticeText}>
                Mã OTP bảo mật 6 chữ số đã được gửi tới email:{'\n'}
                <Text style={styles.securityEmailHighlight}>
                  {twoFactorData.emailMasked || 't***5@gmail.com'}
                </Text>
                {'\n'}(Vui lòng kiểm tra hộp thư đến hoặc mục Spam của Gmail)
              </Text>
            </View>

            <View style={styles.form}>
              <FormField
                label="Mã xác thực OTP (6 chữ số)"
                placeholder="Nhập mã 6 chữ số (vd: 123456)"
                keyboardType="number-pad"
                maxLength={6}
                value={otpCode}
                error={otpError}
                onChangeText={(v) => { setOtpCode(v); setOtpError('') }}
              />

              <TouchableOpacity
                style={[styles.submitBtn, verifying2Fa && styles.submitBtnDisabled]}
                onPress={handleVerify2Fa}
                disabled={verifying2Fa}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#D97706', '#B45309']} style={styles.submitGradient}>
                  <Text style={styles.submitText}>
                    {verifying2Fa ? 'Đang xác thực...' : 'Xác nhận & Đăng nhập'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.twoFactorActionRow}>
                <TouchableOpacity
                  onPress={handleResendOtp}
                  disabled={countdown > 0 || resendingOtp}
                  style={styles.resendBtn}
                >
                  <Text style={[styles.resendBtnText, countdown > 0 && styles.resendBtnTextDisabled]}>
                    {countdown > 0 ? `Gửi lại mã (${countdown}s)` : (resendingOtp ? 'Đang gửi...' : 'Gửi lại mã OTP')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setTwoFactorData(null)}
                  style={styles.cancel2FaBtn}
                >
                  <Text style={styles.cancel2FaBtnText}>← Đổi tài khoản khác</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* ================= GIAO DIỆN ĐĂNG NHẬP CHÍNH ================= */
          <View>
            <View style={styles.headerBlock}>
              <LinearGradient colors={['#EA580C', '#F97316']} style={styles.logoBadge}>
                <Icon name="store" size={24} color={brand.white} />
              </LinearGradient>
              <Text style={styles.title}>Đăng nhập</Text>
              <Text style={styles.subtitle}>VLXD Lý Sáu • Hệ thống quản lý & mua hàng</Text>
            </View>

            {biometricSupported && biometricEnabled && (
              <>
                <TouchableOpacity
                  style={[styles.bioBtn, bioSubmitting && styles.submitBtnDisabled]}
                  onPress={handleBiometricLogin}
                  disabled={bioSubmitting}
                  activeOpacity={0.85}
                >
                  <Icon name="key" size={18} color={brand.ink} />
                  <Text style={styles.bioBtnText}>
                    {bioSubmitting ? 'Đang xác thực...' : `Đăng nhập bằng ${biometricLabel}`}
                  </Text>
                </TouchableOpacity>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>hoặc</Text>
                  <View style={styles.dividerLine} />
                </View>
              </>
            )}

            <View style={styles.form}>
              <FormField
                label="Tên đăng nhập"
                placeholder="Nhập tên đăng nhập"
                autoCapitalize="none"
                autoComplete="username"
                value={username}
                error={usernameError}
                onChangeText={(v) => { setUsername(v); setUsernameError(''); setFormError('') }}
              />

              <FormField
                label="Mật khẩu"
                placeholder="Nhập mật khẩu"
                secureTextEntry={!showPassword}
                autoComplete="current-password"
                value={password}
                error={passwordError}
                onChangeText={(v) => { setPassword(v); setPasswordError(''); setFormError('') }}
                rightElement={
                  <TouchableOpacity
                    style={styles.eyeBtn}
                    onPress={() => setShowPassword((s) => !s)}
                    accessibilityLabel="Ẩn hiện mật khẩu"
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </TouchableOpacity>
                }
              />

              <View style={styles.row}>
                <TouchableOpacity style={styles.checkboxRow} onPress={() => setRemember((r) => !r)}>
                  <View style={[styles.checkbox, remember && styles.checkboxChecked]}>
                    {remember && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>Nhớ đăng nhập</Text>
                </TouchableOpacity>
                <TouchableOpacity>
                  <Text style={styles.forgotLink}>Quên mật khẩu?</Text>
                </TouchableOpacity>
              </View>

              {!!formError && (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorBannerText}>{formError}</Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.85}
              >
                <LinearGradient colors={['#EA580C', '#C2410C']} style={styles.submitGradient}>
                  <Text style={styles.submitText}>{submitting ? 'Đang xử lý...' : 'Đăng nhập'}</Text>
                </LinearGradient>
              </TouchableOpacity>



              <View style={styles.adminSecurityTag}>
                <Icon name="shield" size={14} color="#B45309" />
                <Text style={styles.adminSecurityTagText}>
                  Tài khoản Quản trị được bảo vệ bởi lớp bảo mật 2FA
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </DarkAuthShell>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 22,
    paddingVertical: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  headerBlock: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  shieldBadge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 24,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 13.5,
    color: '#64748B',
    fontFamily: fonts.bodyBold,
    textAlign: 'center',
  },
  bioBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderWidth: 1.5, borderColor: brand.primary, borderRadius: 12, paddingVertical: 13,
  },
  bioBtnText: { color: brand.primary, fontFamily: fonts.bodyBold, fontSize: 15.5 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginVertical: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 13, color: '#94A3B8', fontFamily: fonts.body },
  form: { gap: 14 },
  eyeBtn: { position: 'absolute', right: 12, height: '100%', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: brand.primary, borderColor: brand.primary },
  checkmark: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '800', textAlign: 'center', lineHeight: 14 },
  checkboxLabel: { fontSize: 14, color: '#334155', fontFamily: fonts.bodyBold },
  forgotLink: { fontSize: 14, color: brand.primary, fontFamily: fonts.bodyBold },
  errorBanner: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, padding: 10 },
  errorBannerText: { color: '#DC2626', fontSize: 13.5, fontFamily: fonts.bodyBold, textAlign: 'center' },
  submitBtn: {
    marginTop: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitBtnDisabled: { opacity: 0.65 },
  submitGradient: {
    width: '100%',
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    lineHeight: 22,
    textAlign: 'center',
    includeFontPadding: false,
  },

  adminSecurityTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  adminSecurityTagText: {
    fontSize: 12,
    color: '#B45309',
    fontFamily: fonts.bodyBold,
  },
  // 2FA Specific Styles
  securityNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  securityNoticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#92400E',
    fontFamily: fonts.body,
  },
  securityEmailHighlight: {
    fontFamily: fonts.bodyBold,
    color: '#78350F',
  },
  twoFactorActionRow: {
    marginTop: 6,
    gap: 12,
    alignItems: 'center',
  },
  resendBtn: {
    paddingVertical: 8,
  },
  resendBtnText: {
    fontSize: 14,
    color: brand.primary,
    fontFamily: fonts.bodyBold,
  },
  resendBtnTextDisabled: {
    color: '#94A3B8',
  },
  cancel2FaBtn: {
    paddingVertical: 6,
  },
  cancel2FaBtnText: {
    fontSize: 13.5,
    color: '#64748B',
    fontFamily: fonts.body,
  },
})
