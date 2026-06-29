import { useState } from 'react'
import '../App.css'

const API_BASE_URL = 'http://localhost:5000'

function Login({ onSwitchToRegister, onLoginSuccess }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text()

      if (!response.ok) {
        const errorMessage = typeof data === 'string' ? data : data?.message || 'Đăng nhập thất bại.'
        setMessage({ type: 'error', text: errorMessage })
        return
      }

      localStorage.setItem('salesManagerToken', data?.token || '')
      localStorage.setItem('salesManagerUser', JSON.stringify(data?.user || { username: form.username }))
      onLoginSuccess(data?.user || { username: form.username })
      setMessage({ type: 'success', text: 'Đăng nhập thành công.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể kết nối tới backend.' })
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card-wrap">
      <div className="auth-card">
        <h2>Đăng nhập</h2>
        <p className="page-subtitle">Chào mừng bạn trở lại với Vật Liệu Xây Dựng Pro.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Tên đăng nhập
            <input name="username" value={form.username} onChange={handleChange} required />
          </label>

          <label>
            Mật khẩu
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </label>

          {message.text ? <p className={`message ${message.type}`}>{message.text}</p> : null}

          <button type="submit" className="submit-button">Đăng nhập</button>
        </form>

        <p className="switch-text">
          Chưa có tài khoản?{' '}
          <button type="button" className="text-link" onClick={onSwitchToRegister}>
            Đăng ký ngay
          </button>
        </p>
      </div>
      </div>
    </div>
  )
}

export default Login
