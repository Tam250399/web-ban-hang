import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import '../App.css'
import { authService } from '../services/authService'
import { useAuth } from '../context/auth-context'
import { useRequireOnline } from '../hooks/useRequireOnline'
import PageMeta from './common/PageMeta'
import { PATHS } from '../routes/paths'
import { Icon } from './common/Icon'

/**
 * Component giao diện đăng nhập hệ thống
 */
function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const requireOnline = useRequireOnline()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [usernameError, setUsernameError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [formError, setFormError] = useState('')

  const handleUsernameChange = (event) => {
    setUsername(event.target.value)
    setUsernameError('')
    setFormError('')
  }

  const handlePasswordChange = (event) => {
    setPassword(event.target.value)
    setPasswordError('')
    setFormError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    let uErr = ''
    let pErr = ''
    if (!username.trim()) uErr = 'Vui lòng nhập tên đăng nhập'
    if (!password) pErr = 'Vui lòng nhập mật khẩu'

    if (uErr || pErr) {
      setUsernameError(uErr)
      setPasswordError(pErr)
      return
    }
    if (!requireOnline('Đăng nhập')) return

    setSubmitting(true)
    setFormError('')

    try {
      const data = await authService.login(username, password)
      const loggedIn = data?.user || { username }
      toast.success(`Đăng nhập thành công! Xin chào ${loggedIn.fullName || loggedIn.username}`)
      login(loggedIn)
      const from = location.state?.from?.pathname
      navigate(from || (loggedIn.role === 'Admin' ? PATHS.admin : PATHS.home), { replace: true, viewTransition: true })
    } catch (error) {
      setFormError(error.message || 'Không thể kết nối tới backend.')
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-ink">
      <PageMeta title="Đăng nhập" noIndex />
      <div className="hzd" />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-brand-divider/60 p-6 sm:p-8">
          <Link to={PATHS.home} viewTransition className="inline-block">
            <span className="tag chip-rotate cursor-pointer hover:opacity-90 transition">← Trang chủ Lý Sáu</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-ink mt-2 mb-1">
            Đăng nhập
          </h1>
          <p className="text-sm text-brand-text mb-6">
            Chào mừng bạn trở lại với Vật Liệu Xây Dựng
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1.5">
                Tên đăng nhập
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={handleUsernameChange}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm text-ink bg-white focus:outline-none focus:ring-2 transition ${
                  usernameError
                    ? 'border-red-500 focus:ring-red-400'
                    : 'border-brand-divider focus:ring-primary focus:border-transparent'
                }`}
              />
              {usernameError && <span className="text-xs text-red-600 mt-1 block font-medium">{usernameError}</span>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1.5">
                Mật khẩu
              </label>
              <div className="relative flex items-center">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`w-full px-3.5 py-2.5 pr-11 rounded-xl border text-sm text-ink bg-white focus:outline-none focus:ring-2 transition ${
                    passwordError
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-brand-divider focus:ring-primary focus:border-transparent'
                  }`}
                />
                <button
                  type="button"
                  aria-label="Ẩn hiện mật khẩu"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 text-brand-text hover:text-ink focus:outline-none transition p-1 cursor-pointer"
                >
                  {showPassword ? <Icon name="eyeOff" size={20} /> : <Icon name="eye" size={20} />}
                </button>
              </div>
              {passwordError && <span className="text-xs text-red-600 mt-1 block font-medium">{passwordError}</span>}
            </div>

            <div className="flex items-center justify-between text-sm py-1">
              <label className="flex items-center gap-2 cursor-pointer text-brand-text hover:text-ink select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember((r) => !r)}
                  className="w-4 h-4 rounded border-brand-divider text-primary focus:ring-primary cursor-pointer"
                />
                <span>Nhớ đăng nhập</span>
              </label>
              <a href="#" className="text-xs text-primary hover:text-primary-dark font-medium" onClick={(e) => e.preventDefault()}>
                Quên mật khẩu?
              </a>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-sm font-medium">
                <span>{formError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-extrabold font-display text-base tracking-wide rounded-xl shadow transition transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>

            <p className="text-center text-sm text-brand-text pt-2">
              Chưa có tài khoản?{' '}
              <Link viewTransition className="text-primary hover:text-primary-dark font-bold ml-1" to={PATHS.register}>
                Đăng ký ngay
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
