import { useEffect, useState } from 'react'
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
 * Component giao diện đăng nhập hệ thống (hỗ trợ xác thực 2 bước 2FA cho Quản trị viên)
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

  // 2FA States (bắt buộc cho Admin để bảo vệ dữ liệu nội bộ)
  const [twoFactorData, setTwoFactorData] = useState(null) // { requires2Fa, tempToken, emailMasked, twoFactorMethod }
  const [otpCode, setOtpCode] = useState('')
  const [otpError, setOtpError] = useState('')
  const [verifying2Fa, setVerifying2Fa] = useState(false)
  const [resendingOtp, setResendingOtp] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // Đếm ngược 60s để gửi lại OTP
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((c) => c - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

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

      // Nếu tài khoản là Admin yêu cầu xác thực 2 bước (2FA)
      if (data?.requires2Fa) {
        setTwoFactorData(data)
        setOtpCode('')
        setOtpError('')
        setCountdown(60)
        toast('Tài khoản Quản trị yêu cầu xác thực 2 bước (2FA).', { icon: '🛡️' })
        setSubmitting(false)
        return
      }

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

  // Xác thực mã OTP 2FA cho Quản trị viên
  const handleVerify2Fa = async (event) => {
    event.preventDefault()
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
      const loggedIn = data?.user
      toast.success(`Xác thực 2FA thành công! Chào mừng Quản trị viên ${loggedIn.fullName || loggedIn.username}`)
      login(loggedIn)
      setTwoFactorData(null)
      const from = location.state?.from?.pathname
      navigate(from || PATHS.admin, { replace: true, viewTransition: true })
    } catch (error) {
      setOtpError(error.message || 'Mã xác thực không chính xác hoặc đã hết hạn.')
    } finally {
      setVerifying2Fa(false)
    }
  }

  // Gửi lại mã OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || resendingOtp) return
    setResendingOtp(true)
    setOtpError('')

    try {
      const res = await authService.resend2Fa(twoFactorData.tempToken)
      toast.success(res.message || 'Mã xác thực mới đã được gửi tới email của bạn.')
      setCountdown(60)
    } catch (error) {
      setOtpError(error.message || 'Không thể gửi lại mã OTP.')
    } finally {
      setResendingOtp(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-ink">
      <PageMeta title={twoFactorData ? 'Xác thực 2 bước (2FA)' : 'Đăng nhập'} noIndex />
      <div className="hzd" />
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg border border-brand-divider/60 p-6 sm:p-8">
          
          {/* ================= GIAO DIỆN 2FA CHO ADMIN ================= */}
          {twoFactorData ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500 text-white font-bold text-sm shadow-xs">
                  🛡️
                </span>
                <span className="tag chip-rotate">Bảo mật nội bộ</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-ink mt-2 mb-1">
                Xác thực 2 bước (2FA)
              </h1>
              <p className="text-sm text-brand-text mb-4">
                Bảo vệ dữ liệu nội bộ dành riêng cho Quản trị viên.
              </p>

              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs leading-relaxed mb-5">
                <p className="font-semibold mb-1">Mã xác thực 6 chữ số đã được gửi tới email:</p>
                <p className="font-mono font-bold text-amber-800 text-sm mb-1">{twoFactorData.emailMasked || 't***5@gmail.com'}</p>
                <p className="text-amber-700/80">(Vui lòng kiểm tra hộp thư đến hoặc mục Spam của Gmail)</p>
              </div>

              <form onSubmit={handleVerify2Fa} className="space-y-4">
                <div>
                  <label htmlFor="otpCode" className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1.5">
                    Mã xác thực OTP (6 chữ số)
                  </label>
                  <input
                    id="otpCode"
                    name="otpCode"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    autoFocus
                    placeholder="Nhập mã 6 chữ số (vd: 123456)"
                    value={otpCode}
                    onChange={(e) => { setOtpCode(e.target.value); setOtpError('') }}
                    className={`w-full px-3.5 py-2.5 rounded-xl border text-center font-mono text-lg font-bold tracking-widest text-ink bg-white focus:outline-none focus:ring-2 transition ${
                      otpError
                        ? 'border-red-500 focus:ring-red-400'
                        : 'border-brand-divider focus:ring-primary focus:border-transparent'
                    }`}
                  />
                  {otpError && <span className="text-xs text-red-600 mt-1 block font-medium">{otpError}</span>}
                </div>

                <button
                  type="submit"
                  disabled={verifying2Fa}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-extrabold font-display text-base tracking-wide rounded-xl shadow transition transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {verifying2Fa ? 'Đang xác thực...' : 'Xác nhận & Đăng nhập'}
                </button>

                <div className="flex items-center justify-between pt-2 text-xs">
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={countdown > 0 || resendingOtp}
                    className="text-primary hover:text-primary-dark font-bold disabled:text-neutral-400 cursor-pointer"
                  >
                    {countdown > 0 ? `Gửi lại mã (${countdown}s)` : (resendingOtp ? 'Đang gửi...' : 'Gửi lại mã OTP')}
                  </button>

                  <button
                    type="button"
                    onClick={() => setTwoFactorData(null)}
                    className="text-brand-text hover:text-ink font-medium cursor-pointer"
                  >
                    ← Đổi tài khoản khác
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* ================= GIAO DIỆN ĐĂNG NHẬP CHÍNH ================= */
            <div>
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
          )}
        </div>
      </div>
    </div>
  )
}

export default Login
