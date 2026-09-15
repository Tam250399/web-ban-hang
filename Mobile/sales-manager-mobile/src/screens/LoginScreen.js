import { useState } from 'react'
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

export default function LoginScreen({ navigation }) {
  const {
    login, biometricSupported, biometricLabel, biometricEnabled,
    enableBiometricLogin, loginWithBiometric,
  } = useAuth()
  const requireOnline = useRequireOnline()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [bioSubmitting, setBioSubmitting] = useState(false)

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

  const handleBiometricLogin = async () => {
    setBioSubmitting(true)
    try {
      const ok = await loginWithBiometric()
      if (ok) navigation.navigate('Home')
    } finally {
      setBioSubmitting(false)
    }
  }

  return (
    <DarkAuthShell>
      <View style={styles.card}>
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

        </View>
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
  submitBtnDisabled: { opacity: 0.7 },
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
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 6 },
  switchText: { fontSize: 14, color: '#64748B', fontFamily: fonts.body },
  switchLink: { fontSize: 14, color: brand.primary, fontFamily: fonts.bodyBold },
})
