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

/**
 * Component PasswordStrengthBar
 */
function PasswordStrengthBar({ password }) {
  const strength = getPasswordStrength(password)
  if (!password) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1.5 h-1.5 w-full">
        {[1, 2, 3].map(step => (
          <span
            key={step}
            className="flex-1 rounded-full bg-neutral-200 transition-colors duration-300"
            style={step <= strength.level ? { background: strength.color } : undefined}
          />
        ))}
      </div>
      <span className="text-xs font-semibold mt-1 text-right block" style={{ color: strength.color }}>
        {strength.label}
      </span>
    </div>
  )
}

/**
 * Component giao diện đăng ký tài khoản khách hàng mới
 */
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

  const fieldErrors = useMemo(() => {
    const errs = {}
    if (touched.username) {
      const e = validateUsername(form.username)
      if (e) errs.username = e
    }
    if (touched.password) {
      const e = validatePassword(form.password)
      if (e) errs.password = e
    }
    if (touched.confirmPassword) {
      if (!form.confirmPassword) errs.confirmPassword = 'Vui lòng xác nhận mật khẩu'
      else if (form.password !== form.confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }
    if (touched.fullName) {
      const e = validateFullName(form.fullName)
      if (e) errs.fullName = e
    }
    if (touched.email && form.email) {
      const e = validateEmail(form.email)
      if (e) errs.email = e
    }
    if (touched.phoneNumber && form.phoneNumber) {
      const e = validatePhoneNumber(form.phoneNumber)
      if (e) errs.phoneNumber = e
    }
    return errs
  }, [form, touched])

  const errorFor = (field) => fieldErrors[field]

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!requireOnline('Đăng ký tài khoản')) return

    const allTouched = {
      username: true, password: true, confirmPassword: true,
      fullName: true, email: true, phoneNumber: true,
    }
    setTouched(allTouched)

    const uErr = validateUsername(form.username)
    const pErr = validatePassword(form.password)
    const cErr = !form.confirmPassword ? 'Vui lòng xác nhận mật khẩu'
      : form.password !== form.confirmPassword ? 'Mật khẩu xác nhận không khớp' : ''
    const fnErr = validateFullName(form.fullName)
    const emErr = form.email ? validateEmail(form.email) : ''
    const phErr = form.phoneNumber ? validatePhoneNumber(form.phoneNumber) : ''

    if (uErr || pErr || cErr || fnErr || emErr || phErr) {
      setMessage({ type: 'error', text: 'Vui lòng kiểm tra lại các trường thông tin bên dưới.' })
      return
    }

    setMessage({ type: '', text: '' })
    setSubmitting(true)

    try {
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
    <div className="min-h-screen flex flex-col bg-brand-bg text-ink">
      <PageMeta title="Đăng ký tài khoản" noIndex />
      <div className="hzd" />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 py-8">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-brand-divider/60 p-6 sm:p-8">
          <Link to={PATHS.home} viewTransition className="inline-block">
            <span className="tag chip-rotate cursor-pointer hover:opacity-90 transition">← Trang chủ Lý Sáu</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-ink mt-2 mb-1">
            Đăng ký tài khoản
          </h1>
          <p className="text-sm text-brand-text mb-6">
            Tạo tài khoản để mua hàng và theo dõi đơn hàng dễ dàng.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reg-username" className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1.5">
                Tên đăng nhập <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-username"
                name="username"
                autoComplete="username"
                placeholder="Nhập tên đăng nhập"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-ink bg-white focus:outline-none focus:ring-2 transition ${
                  errorFor('username')
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-brand-divider focus:ring-primary focus:border-transparent'
                }`}
                value={form.username}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errorFor('username') && <span className="text-xs text-red-600 mt-1 block font-medium">{errorFor('username')}</span>}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1.5">
                Mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-password"
                type="password"
                name="password"
                autoComplete="new-password"
                placeholder={`Ít nhất ${PASSWORD_MIN_LENGTH} ký tự, có chữ và số`}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-ink bg-white focus:outline-none focus:ring-2 transition ${
                  errorFor('password')
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-brand-divider focus:ring-primary focus:border-transparent'
                }`}
                value={form.password}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <PasswordStrengthBar password={form.password} />
              {errorFor('password') && <span className="text-xs text-red-600 mt-1 block font-medium">{errorFor('password')}</span>}
            </div>

            <div>
              <label htmlFor="reg-confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1.5">
                Nhập lại mật khẩu <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-confirmPassword"
                type="password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="Nhập lại mật khẩu để xác nhận"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-ink bg-white focus:outline-none focus:ring-2 transition ${
                  errorFor('confirmPassword')
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-brand-divider focus:ring-primary focus:border-transparent'
                }`}
                value={form.confirmPassword}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errorFor('confirmPassword') && <span className="text-xs text-red-600 mt-1 block font-medium">{errorFor('confirmPassword')}</span>}
            </div>

            <div>
              <label htmlFor="reg-fullName" className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1.5">
                Họ và tên <span className="text-red-500">*</span>
              </label>
              <input
                id="reg-fullName"
                name="fullName"
                placeholder="Nguyễn Văn A"
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-ink bg-white focus:outline-none focus:ring-2 transition ${
                  errorFor('fullName')
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-brand-divider focus:ring-primary focus:border-transparent'
                }`}
                value={form.fullName}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              {errorFor('fullName') && <span className="text-xs text-red-600 mt-1 block font-medium">{errorFor('fullName')}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1.5">
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  placeholder="example@gmail.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-ink bg-white focus:outline-none focus:ring-2 transition ${
                    errorFor('email')
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-brand-divider focus:ring-primary focus:border-transparent'
                  }`}
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errorFor('email') && <span className="text-xs text-red-600 mt-1 block font-medium">{errorFor('email')}</span>}
              </div>

              <div>
                <label htmlFor="reg-phoneNumber" className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1.5">
                  Số điện thoại
                </label>
                <input
                  id="reg-phoneNumber"
                  name="phoneNumber"
                  autoComplete="tel"
                  placeholder="0987654321"
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-ink bg-white focus:outline-none focus:ring-2 transition ${
                    errorFor('phoneNumber')
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-brand-divider focus:ring-primary focus:border-transparent'
                  }`}
                  value={form.phoneNumber}
                  onChange={handleChange}
                  onBlur={handleBlur}
                />
                {errorFor('phoneNumber') && <span className="text-xs text-red-600 mt-1 block font-medium">{errorFor('phoneNumber')}</span>}
              </div>
            </div>

            {message.text && (
              <div
                className={`p-3 rounded-xl text-sm font-medium ${
                  message.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-extrabold font-display text-base tracking-wide rounded-xl shadow transition transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Đang xử lý...' : 'Tạo tài khoản'}
            </button>
          </form>

          <p className="text-center text-sm text-brand-text pt-4">
            Đã có tài khoản?{' '}
            <Link viewTransition className="text-primary hover:text-primary-dark font-bold ml-1" to={PATHS.login}>
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
