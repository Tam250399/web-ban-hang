import { useState } from 'react'
import '../App.css'

const API_BASE_URL = 'http://localhost:5000'

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
      const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })

      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text()

      if (!response.ok) {
        const errorMessage = typeof data === 'string' ? data : data?.message || 'Đăng nhập thất bại.'
        setFormError(errorMessage)
        setSubmitting(false)
        return
      }

      localStorage.setItem('salesManagerToken', data?.token || '')
      localStorage.setItem('salesManagerUser', JSON.stringify(data?.user || { username }))
      onLoginSuccess(data?.user || { username })
    } catch (error) {
      setFormError('Không thể kết nối tới backend.')
      setSubmitting(false)
    }
  }

  return (
    <div className="login-shell">
      <div className="login-card">
        <h1 className="login-title">Đăng nhập</h1>
        <p className="login-subtitle">Chào mừng bạn trở lại với Vật Liệu Xây Dựng</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-field">
            <label htmlFor="username" className="login-label">Tên đăng nhập</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              placeholder="Nhập tên đăng nhập"
              value={username}
              onChange={handleUsernameChange}
              className={`login-input ${usernameError ? 'has-error' : ''}`}
            />
            {usernameError && <span className="login-field-error">{usernameError}</span>}
          </div>

          <div className="login-field">
            <label htmlFor="password" className="login-label">Mật khẩu</label>
            <div className="login-password-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={handlePasswordChange}
                className={`login-input login-input-password ${passwordError ? 'has-error' : ''}`}
              />
              <button
                type="button"
                aria-label="Ẩn hiện mật khẩu"
                onClick={() => setShowPassword((s) => !s)}
                className="login-eye-btn"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            {passwordError && <span className="login-field-error">{passwordError}</span>}
          </div>

          <div className="login-row">
            <label className="login-checkbox-label">
              <input
                type="checkbox"
                checked={remember}
                onChange={() => setRemember((r) => !r)}
                className="login-checkbox"
              />
              Nhớ đăng nhập
            </label>
            <a href="#" className="login-forgot-link" onClick={(e) => e.preventDefault()}>
              Quên mật khẩu?
            </a>
          </div>

          {formError && (
            <div className="login-error-banner">
              <span>{formError}</span>
            </div>
          )}

          <button type="submit" disabled={submitting} className="login-submit">
            {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>

          <p className="login-switch">
            Chưa có tài khoản?{' '}
            <button type="button" className="login-switch-link" onClick={onSwitchToRegister}>
              Đăng ký ngay
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}

export default Login
