import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import '../App.css'
import { authService } from '../services/authService'
import { useRequireOnline } from '../hooks/useRequireOnline'
import PageMeta from './common/PageMeta'
import { PATHS } from '../routes/paths'
import {
  validateUsername, validatePassword, validateFullName,
  validateEmail, validatePhoneNumber, getPasswordStrength, PASSWORD_MIN_LENGTH,
} from '../utils/validation'

// ── Thanh độ mạnh mật khẩu ──
function PasswordStrengthBar({ password }) {
  const strength = getPasswordStrength(password)
  if (!password) return null
  return (
    <div className="pw-strength">
      <div className="pw-strength-track">
        {[1, 2, 3].map(step => (
          <span
            key={step}
            className="pw-strength-seg"
            style={step <= strength.level ? { background: strength.color } : undefined}
          />
        ))}
      </div>
      <span className="pw-strength-label" style={{ color: strength.color }}>{strength.label}</span>
    </div>
  )
}

function Register() {
  const requireOnline = useRequireOnline()
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    email: '',
    phoneNumber: '',
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)
  // Chỉ hiện lỗi của ô người dùng đã rời khỏi hoặc sau khi bấm gửi một lần —
  // bật lỗi ngay từ ký tự đầu tiên thì ô nào cũng đỏ trong lúc còn đang gõ dở.
  const [touched, setTouched] = useState({})

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setMessage({ type: '', text: '' })
  }

  const handleBlur = (event) => {
    const { name } = event.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

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
  const errorFor = (name) => (touched[name] ? errors[name] : '')

  const handleSubmit = async (event) => {
    event.preventDefault()
    // Bấm gửi thì hiện hết lỗi đang có, kể cả ô chưa chạm tới.
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
      // confirmPassword chỉ để đối chiếu ở client, backend không nhận field này.
      const payload = { ...form }
      delete payload.confirmPassword
      const data = await authService.register({
        ...payload,
        username: payload.username.trim(),
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        phoneNumber: payload.phoneNumber.trim(),
      })
      setMessage({ type: 'success', text: data?.message || 'Đăng ký thành công.' })
      setForm({ username: '', password: '', confirmPassword: '', fullName: '', email: '', phoneNumber: '' })
      setTouched({})
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể kết nối tới backend.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <PageMeta title="Đăng ký tài khoản" noIndex />
      <div className="hzd" />
      <div className="auth-center">
        <div className="auth-card">
          <span className="tag chip-rotate">Lý Sáu</span>
          <h1 className="auth-title">Đăng ký tài khoản</h1>
          <p className="auth-subtitle">Tạo tài khoản để mua hàng và theo dõi đơn hàng.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="reg-username" className="auth-label">Tên đăng nhập *</label>
              <input
                id="reg-username" name="username" autoComplete="username"
                className={`auth-input ${errorFor('username') ? 'has-error' : ''}`}
                value={form.username} onChange={handleChange} onBlur={handleBlur}
              />
              {errorFor('username') && <span className="auth-field-error">{errorFor('username')}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="reg-password" className="auth-label">Mật khẩu *</label>
              <input
                id="reg-password" type="password" name="password" autoComplete="new-password"
                placeholder={`Ít nhất ${PASSWORD_MIN_LENGTH} ký tự, có chữ và số`}
                className={`auth-input ${errorFor('password') ? 'has-error' : ''}`}
                value={form.password} onChange={handleChange} onBlur={handleBlur}
              />
              <PasswordStrengthBar password={form.password} />
              {errorFor('password') && <span className="auth-field-error">{errorFor('password')}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="reg-confirmPassword" className="auth-label">Nhập lại mật khẩu *</label>
              <input
                id="reg-confirmPassword" type="password" name="confirmPassword" autoComplete="new-password"
                className={`auth-input ${errorFor('confirmPassword') ? 'has-error' : ''}`}
                value={form.confirmPassword} onChange={handleChange} onBlur={handleBlur}
              />
              {errorFor('confirmPassword') && <span className="auth-field-error">{errorFor('confirmPassword')}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="reg-fullName" className="auth-label">Họ và tên *</label>
              <input
                id="reg-fullName" name="fullName"
                className={`auth-input ${errorFor('fullName') ? 'has-error' : ''}`}
                value={form.fullName} onChange={handleChange} onBlur={handleBlur}
              />
              {errorFor('fullName') && <span className="auth-field-error">{errorFor('fullName')}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email" className="auth-label">Email</label>
              <input
                id="reg-email" type="email" name="email" autoComplete="email"
                className={`auth-input ${errorFor('email') ? 'has-error' : ''}`}
                value={form.email} onChange={handleChange} onBlur={handleBlur}
              />
              {errorFor('email') && <span className="auth-field-error">{errorFor('email')}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="reg-phoneNumber" className="auth-label">Số điện thoại</label>
              <input
                id="reg-phoneNumber" name="phoneNumber" autoComplete="tel"
                placeholder="0987654321"
                className={`auth-input ${errorFor('phoneNumber') ? 'has-error' : ''}`}
                value={form.phoneNumber} onChange={handleChange} onBlur={handleBlur}
              />
              {errorFor('phoneNumber') && <span className="auth-field-error">{errorFor('phoneNumber')}</span>}
            </div>

            {message.text ? <p className={`message ${message.type}`}>{message.text}</p> : null}

            <button type="submit" className="auth-submit" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="auth-switch">
            Đã có tài khoản?{' '}
            <Link className="auth-switch-link" to={PATHS.login}>Đăng nhập</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
