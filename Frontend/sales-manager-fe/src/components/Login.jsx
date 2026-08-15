import { useState } from 'react'
import toast from 'react-hot-toast'
import '../App.css'
import { authService } from '../services/authService'

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function Login({ onSwitchToRegister, onLoginSuccess }) {
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
    else if (password.length < 4) pErr = 'Mật khẩu tối thiểu 4 ký tự'

    if (uErr || pErr) {
      setUsernameError(uErr)
      setPasswordError(pErr)
      return
    }

    setSubmitting(true)
    setFormError('')

    try {
      const data = await authService.login(username, password)
      toast.success(`Đăng nhập thành công! Xin chào ${data?.user?.fullName || data?.user?.username || username}`)
      onLoginSuccess(data?.user || { username })
    } catch (error) {
      setFormError(error.message || 'Không thể kết nối tới backend.')
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-shell">
      <div className="hzd" />
      <div className="auth-center">
        <div className="auth-card">
          <span className="tag chip-rotate">Lý Sáu</span>
          <h1 className="auth-title">Đăng nhập</h1>
          <p className="auth-subtitle">Chào mừng bạn trở lại với Vật Liệu Xây Dựng</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="username" className="auth-label">Tên đăng nhập</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Nhập tên đăng nhập"
                value={username}
                onChange={handleUsernameChange}
                className={`auth-input ${usernameError ? 'has-error' : ''}`}
              />
              {usernameError && <span className="auth-field-error">{usernameError}</span>}
            </div>

            <div className="auth-field">
              <label htmlFor="password" className="auth-label">Mật khẩu</label>
              <div className="auth-password-wrap">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={handlePasswordChange}
                  className={`auth-input auth-input-password ${passwordError ? 'has-error' : ''}`}
                />
                <button
                  type="button"
                  aria-label="Ẩn hiện mật khẩu"
                  onClick={() => setShowPassword((s) => !s)}
                  className="auth-eye-btn"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {passwordError && <span className="auth-field-error">{passwordError}</span>}
            </div>

            <div className="auth-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember((r) => !r)}
                  className="auth-checkbox"
                />
                Nhớ đăng nhập
              </label>
              <a href="#" className="auth-forgot-link" onClick={(e) => e.preventDefault()}>
                Quên mật khẩu?
              </a>
            </div>

            {formError && (
              <div className="auth-error-banner">
                <span>{formError}</span>
              </div>
            )}

            <button type="submit" disabled={submitting} className="auth-submit">
              {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Login
