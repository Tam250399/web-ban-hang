import { useState } from 'react'
import '../App.css'
import { authService } from '../services/authService'

function Register({ onSwitchToLogin }) {
  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    phoneNumber: '',
  })
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setMessage({ type: '', text: '' })

    try {
      const data = await authService.register(form)
      setMessage({ type: 'success', text: data?.message || 'Đăng ký thành công.' })
      setForm({ username: '', password: '', fullName: '', email: '', phoneNumber: '' })
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Không thể kết nối tới backend.' })
    }
  }

  return (
    <div className="auth-shell">
      <div className="hzd" />
      <div className="auth-center">
        <div className="auth-card">
          <span className="tag chip-rotate">Đức Lợi</span>
          <h1 className="auth-title">Đăng ký tài khoản</h1>
          <p className="auth-subtitle">Tạo tài khoản để mua hàng và theo dõi đơn hàng.</p>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="reg-username" className="auth-label">Tên đăng nhập</label>
              <input id="reg-username" name="username" className="auth-input" value={form.username} onChange={handleChange} required />
            </div>

            <div className="auth-field">
              <label htmlFor="reg-password" className="auth-label">Mật khẩu</label>
              <input id="reg-password" type="password" name="password" className="auth-input" value={form.password} onChange={handleChange} required />
            </div>

            <div className="auth-field">
              <label htmlFor="reg-fullName" className="auth-label">Họ và tên</label>
              <input id="reg-fullName" name="fullName" className="auth-input" value={form.fullName} onChange={handleChange} required />
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email" className="auth-label">Email</label>
              <input id="reg-email" type="email" name="email" className="auth-input" value={form.email} onChange={handleChange} required />
            </div>

            <div className="auth-field">
              <label htmlFor="reg-phoneNumber" className="auth-label">Số điện thoại</label>
              <input id="reg-phoneNumber" name="phoneNumber" className="auth-input" value={form.phoneNumber} onChange={handleChange} required />
            </div>

            {message.text ? <p className={`message ${message.type}`}>{message.text}</p> : null}

            <button type="submit" className="auth-submit">Tạo tài khoản</button>
          </form>

          <p className="auth-switch">
            Đã có tài khoản?{' '}
            <button type="button" className="auth-switch-link" onClick={onSwitchToLogin}>
              Đăng nhập
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register
