import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { authService } from '../services/authService'
import { useAuth } from '../context/auth-context'
import DarkAuthShell from '../components/ui/DarkAuthShell'
import BrandTag from '../components/ui/BrandTag'
import FormField from '../components/ui/FormField'
import { PrimaryButton } from '../components/ui/Buttons'
import { EyeIcon, EyeOffIcon } from '../components/ui/icons'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    let uErr = ''
    let pErr = ''
    if (!username.trim()) uErr = 'Vui lòng nhập tên đăng nhập'
    if (!password) pErr = 'Vui lòng nhập mật khẩu'
    else if (password.length < 4) pErr = 'Mật khẩu tối thiểu 4 ký tự'

    setUsernameError(uErr)
    setPasswordError(pErr)
    if (uErr || pErr) return

    setSubmitting(true)
    setFormError('')
    try {
      const data = await authService.login(username, password)
      const user = data?.user || { username }
      Toast.show({ type: 'success', text1: `Xin chào ${user.fullName || user.username}` })
      login(user)
      navigation.navigate('Home')
    } catch (error) {
      setFormError(error.message || 'Không thể kết nối tới backend.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DarkAuthShell>
      <View style={styles.card}>
        <BrandTag />
        <Text style={styles.title}>Đăng nhập</Text>
        <Text style={styles.subtitle}>Chào mừng bạn trở lại với Vật Liệu Xây Dựng</Text>

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
              <View style={[styles.checkbox, remember && styles.checkboxChecked]} />
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

          <PrimaryButton
            title={submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submit}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Chưa có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.switchLink}>Đăng ký ngay</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </DarkAuthShell>
  )
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: brand.white,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: brand.cardBorder,
    padding: 24,
  },
  title: {
    marginTop: 14,
    marginBottom: 6,
    fontFamily: fonts.displayExtraBold,
    fontSize: 28,
    color: brand.ink,
  },
  subtitle: {
    marginBottom: 22,
    fontSize: 13,
    lineHeight: 19,
    color: brand.textMuted,
    fontFamily: fonts.body,
  },
  form: { gap: 16 },
  eyeBtn: { position: 'absolute', right: 10, padding: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: -4 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 15, height: 15, borderRadius: 4, borderWidth: 1.5, borderColor: brand.textMuted },
  checkboxChecked: { backgroundColor: brand.primary, borderColor: brand.primary },
  checkboxLabel: { fontSize: 12.5, color: brand.textMuted, fontFamily: fonts.body },
  forgotLink: { fontSize: 12.5, color: brand.primary, fontFamily: fonts.bodySemiBold },
  errorBanner: { backgroundColor: '#fee2e2', borderRadius: 8, padding: 10 },
  errorBannerText: { color: brand.danger, fontSize: 12.5, fontFamily: fonts.body },
  submit: { marginTop: 4 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  switchText: { fontSize: 12.5, color: brand.textMuted, fontFamily: fonts.body },
  switchLink: { fontSize: 12.5, color: brand.primary, fontFamily: fonts.bodyBold },
})
