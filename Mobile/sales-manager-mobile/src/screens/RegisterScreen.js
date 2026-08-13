import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { authService } from '../services/authService'
import DarkAuthShell from '../components/ui/DarkAuthShell'
import BrandTag from '../components/ui/BrandTag'
import FormField from '../components/ui/FormField'
import { PrimaryButton } from '../components/ui/Buttons'
import { EyeIcon, EyeOffIcon } from '../components/ui/icons'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'

const EMPTY_FORM = { username: '', password: '', fullName: '', email: '', phoneNumber: '' }

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const setField = (name) => (value) => setForm((prev) => ({ ...prev, [name]: value }))

  const handleSubmit = async () => {
    setMessage({ type: '', text: '' })
    setSubmitting(true)
    try {
      const data = await authService.register(form)
      setMessage({ type: 'success', text: data?.message || 'Đăng ký thành công.' })
      setForm(EMPTY_FORM)
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể kết nối tới backend.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DarkAuthShell>
      <View style={styles.card}>
        <BrandTag />
        <Text style={styles.title}>Đăng ký tài khoản</Text>
        <Text style={styles.subtitle}>Tạo tài khoản để mua hàng và theo dõi đơn hàng.</Text>

        <View style={styles.form}>
          <FormField label="Tên đăng nhập" autoCapitalize="none" autoComplete="username" value={form.username} onChangeText={setField('username')} />

          <FormField
            label="Mật khẩu"
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            value={form.password}
            onChangeText={setField('password')}
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

          <FormField label="Họ và tên" value={form.fullName} onChangeText={setField('fullName')} />
          <FormField label="Email" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={setField('email')} />
          <FormField label="Số điện thoại" keyboardType="phone-pad" value={form.phoneNumber} onChangeText={setField('phoneNumber')} />

          {!!message.text && (
            <View style={[styles.messageBanner, message.type === 'error' ? styles.errorBanner : styles.successBanner]}>
              <Text style={message.type === 'error' ? styles.errorText : styles.successText}>{message.text}</Text>
            </View>
          )}

          <PrimaryButton
            title={submitting ? 'Đang đăng ký...' : 'Tạo tài khoản'}
            onPress={handleSubmit}
            loading={submitting}
            style={styles.submit}
          />

          <View style={styles.switchRow}>
            <Text style={styles.switchText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.switchLink}>Đăng nhập</Text>
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
    fontSize: 26,
    color: brand.ink,
  },
  subtitle: {
    marginBottom: 20,
    fontSize: 13,
    lineHeight: 19,
    color: brand.textMuted,
    fontFamily: fonts.body,
  },
  form: { gap: 14 },
  eyeBtn: { position: 'absolute', right: 10, padding: 4 },
  messageBanner: { borderRadius: 8, padding: 10 },
  errorBanner: { backgroundColor: '#fee2e2' },
  successBanner: { backgroundColor: '#dcfce7' },
  errorText: { color: brand.danger, fontSize: 12.5, fontFamily: fonts.body },
  successText: { color: brand.success, fontSize: 12.5, fontFamily: fonts.body },
  submit: { marginTop: 6 },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  switchText: { fontSize: 12.5, color: brand.textMuted, fontFamily: fonts.body },
  switchLink: { fontSize: 12.5, color: brand.primary, fontFamily: fonts.bodyBold },
})
