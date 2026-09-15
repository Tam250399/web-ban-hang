import { useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { authService } from '../services/authService'
import DarkAuthShell from '../components/ui/DarkAuthShell'
import FormField from '../components/ui/FormField'
import { EyeIcon, EyeOffIcon } from '../components/ui/icons'
import { useRequireOnline } from '../hooks/useRequireOnline'
import {
  validateUsername, validatePassword, validateFullName,
  validateEmail, validatePhoneNumber, getPasswordStrength, PASSWORD_MIN_LENGTH,
} from '../utils/validation'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'
import { Icon } from '../components/ui/Icon'

const EMPTY_FORM = {
  username: '', password: '', confirmPassword: '',
  fullName: '', email: '', phoneNumber: '',
}

function PasswordStrengthBar({ password }) {
  const strength = getPasswordStrength(password)
  if (!password) return null
  return (
    <View style={styles.strengthWrap}>
      <View style={styles.strengthTrack}>
        {[1, 2, 3].map((step) => (
          <View
            key={step}
            style={[
              styles.strengthSegment,
              step <= strength.level && { backgroundColor: strength.color },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
    </View>
  )
}

export default function RegisterScreen({ navigation }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState({})
  const requireOnline = useRequireOnline()

  const setField = (name) => (value) => {
    setForm((prev) => ({ ...prev, [name]: value }))
    setMessage({ type: '', text: '' })
  }

  const markTouched = (name) => () => setTouched((prev) => ({ ...prev, [name]: true }))

  const errors = useMemo(() => ({
    username: validateUsername(form.username),
    password: validatePassword(form.password),
    confirmPassword: !form.confirmPassword
      ? 'Vui lòng nhập lại mật khẩu'
      : form.confirmPassword !== form.password
        ? 'Mật khẩu nhập lại không khớp'
        : '',
    fullName: validateFullName(form.fullName),
    email: validateEmail(form.email),
    phoneNumber: validatePhoneNumber(form.phoneNumber),
  }), [form])

  const firstError = Object.values(errors).find(Boolean)

  const handleSubmit = async () => {
    setTouched({
      username: true, password: true, confirmPassword: true,
      fullName: true, email: true, phoneNumber: true,
    })
    if (firstError) {
      setMessage({ type: 'error', text: firstError })
      return
    }
    if (!requireOnline('Đăng ký tài khoản')) return

    setMessage({ type: '', text: '' })
    setSubmitting(true)
    try {
      const { confirmPassword, ...payload } = form
      const data = await authService.register({
        ...payload,
        username: payload.username.trim(),
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        phoneNumber: payload.phoneNumber.trim(),
      })
      setMessage({ type: 'success', text: data?.message || 'Đăng ký tài khoản thành công!' })
      setForm(EMPTY_FORM)
      setTouched({})
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể kết nối tới backend.' })
    } finally {
      setSubmitting(false)
    }
  }

  const errorFor = (name) => (touched[name] ? errors[name] : '')

  return (
    <DarkAuthShell>
      <View style={styles.card}>
        <View style={styles.headerBlock}>
          <LinearGradient colors={['#EA580C', '#F97316']} style={styles.logoBadge}>
            <Icon name="store" size={24} color={brand.white} />
          </LinearGradient>
          <Text style={styles.title}>Đăng ký tài khoản</Text>
          <Text style={styles.subtitle}>VLXD Lý Sáu • Tạo tài khoản mua hàng</Text>
        </View>

        <View style={styles.form}>
          <FormField
            label="Tên đăng nhập *"
            autoCapitalize="none"
            autoComplete="username"
            value={form.username}
            error={errorFor('username')}
            onBlur={markTouched('username')}
            onChangeText={setField('username')}
            placeholder="Nhập tên đăng nhập"
          />

          <View>
            <FormField
              label="Mật khẩu *"
              placeholder={'Ít nhất ' + PASSWORD_MIN_LENGTH + ' ký tự, có chữ và số'}
              secureTextEntry={!showPassword}
              autoComplete="new-password"
              value={form.password}
              error={errorFor('password')}
              onBlur={markTouched('password')}
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
            <PasswordStrengthBar password={form.password} />
          </View>

          <FormField
            label="Nhập lại mật khẩu *"
            placeholder="Gõ lại mật khẩu ở trên"
            secureTextEntry={!showPassword}
            autoComplete="new-password"
            value={form.confirmPassword}
            error={errorFor('confirmPassword')}
            onBlur={markTouched('confirmPassword')}
            onChangeText={setField('confirmPassword')}
          />

          <FormField
            label="Họ và tên *"
            value={form.fullName}
            error={errorFor('fullName')}
            onBlur={markTouched('fullName')}
            onChangeText={setField('fullName')}
            placeholder="Nhập họ và tên đầy đủ"
          />
          <FormField
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            value={form.email}
            error={errorFor('email')}
            onBlur={markTouched('email')}
            onChangeText={setField('email')}
            placeholder="vi-du@gmail.com"
          />
          <FormField
            label="Số điện thoại"
            keyboardType="phone-pad"
            value={form.phoneNumber}
            error={errorFor('phoneNumber')}
            onBlur={markTouched('phoneNumber')}
            onChangeText={setField('phoneNumber')}
            placeholder="0987654321"
          />

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
  form: { gap: 12 },
  strengthWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  strengthTrack: { flex: 1, flexDirection: 'row', gap: 4 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2, backgroundColor: '#E2E8F0' },
  strengthLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, minWidth: 78, textAlign: 'right' },
  eyeBtn: { position: 'absolute', right: 12, height: '100%', justifyContent: 'center' },
  messageBanner: { borderRadius: 10, padding: 10, borderWidth: 1 },
  errorBanner: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  successBanner: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  errorText: { color: '#DC2626', fontSize: 13.5, fontFamily: fonts.bodyBold, textAlign: 'center' },
  successText: { color: '#16A34A', fontSize: 13.5, fontFamily: fonts.bodyBold, textAlign: 'center' },
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
