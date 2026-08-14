import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { authService } from '../services/authService'
import DarkAuthShell from '../components/ui/DarkAuthShell'
import FormField from '../components/ui/FormField'
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
      setMessage({ type: 'success', text: data?.message || 'Đăng ký tài khoản thành công!' })
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
        <View style={styles.headerBlock}>
          <LinearGradient colors={['#EA580C', '#F97316']} style={styles.logoBadge}>
            <Text style={styles.logoIcon}>🏪</Text>
          </LinearGradient>
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>VLXD Đức Lợi • Tạo tài khoản mua hàng</Text>
        </View>

        <View style={styles.form}>
          <FormField label="Tên đăng nhập *" autoCapitalize="none" autoComplete="username" value={form.username} onChangeText={setField('username')} placeholder="Nhập tên đăng nhập" />

          <FormField
            label="Mật khẩu *"
            placeholder="Nhập mật khẩu"
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

          <FormField label="Họ và tên" value={form.fullName} onChangeText={setField('fullName')} placeholder="Nhập họ và tên đầy đủ" />
          <FormField label="Email" keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={setField('email')} placeholder="vi-du@gmail.com" />
          <FormField label="Số điện thoại" keyboardType="phone-pad" value={form.phoneNumber} onChangeText={setField('phoneNumber')} placeholder="0987654321" />

          {!!message.text && (
            <View style={[styles.messageBanner, message.type === 'error' ? styles.errorBanner : styles.successBanner]}>
              <Text style={message.type === 'error' ? styles.errorText : styles.successText}>{message.text}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#EA580C', '#C2410C']} style={styles.submitGradient}>
              <Text style={styles.submitText}>{submitting ? 'Đang xử lý...' : 'Đăng ký ngay'}</Text>
            </LinearGradient>
          </TouchableOpacity>

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
    marginBottom: 16,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoIcon: { fontSize: 24 },
  title: {
    fontFamily: fonts.displayExtraBold,
    fontSize: 24,
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12.5,
    color: '#64748B',
    fontFamily: fonts.bodyBold,
    textAlign: 'center',
  },
  form: { gap: 12 },
  eyeBtn: { position: 'absolute', right: 12, height: '100%', justifyContent: 'center' },
  messageBanner: { borderRadius: 10, padding: 10, borderWidth: 1 },
  errorBanner: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  successBanner: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  errorText: { color: '#DC2626', fontSize: 12.5, fontFamily: fonts.bodyBold, textAlign: 'center' },
  successText: { color: '#16A34A', fontSize: 12.5, fontFamily: fonts.bodyBold, textAlign: 'center' },
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
    fontSize: 16,
    lineHeight: 20,
    textAlign: 'center',
    includeFontPadding: false,
  },
  switchRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 6 },
  switchText: { fontSize: 13, color: '#64748B', fontFamily: fonts.body },
  switchLink: { fontSize: 13, color: brand.primary, fontFamily: fonts.bodyBold },
})
