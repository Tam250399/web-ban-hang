import { useState } from 'react'
import '../App.css'

const API_BASE_URL = 'http://localhost:5000'

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
      const response = await fetch(`${API_BASE_URL}/api/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const contentType = response.headers.get('content-type') || ''
      const data = contentType.includes('application/json')
        ? await response.json()
        : await response.text()

      if (!response.ok) {
        const errorMessage = typeof data === 'string' ? data : data?.message || 'Đăng ký thất bại.'
        setMessage({ type: 'error', text: errorMessage })
        return
      }

      setMessage({ type: 'success', text: data?.message || 'Đăng ký thành công.' })
      setForm({ username: '', password: '', fullName: '', email: '', phoneNumber: '' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Không thể kết nối tới backend.' })
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card-wrap">
      <div className="auth-card">
        <h2>Đăng ký</h2>
        <p className="page-subtitle">Tạo tài khoản để mua hàng và theo dõi đơn hàng.</p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Tên đăng nhập
            <input name="username" value={form.username} onChange={handleChange} required />
          </label>

          <label>
            Mật khẩu
            <input type="password" name="password" value={form.password} onChange={handleChange} required />
          </label>

          <label>
            Họ và tên
            <input name="fullName" value={form.fullName} onChange={handleChange} required />
          </label>

          <label>
            Email
            <input type="email" name="email" value={form.email} onChange={handleChange} required />
          </label>

          <label>
            Số điện thoại
            <input name="phoneNumber" value={form.phoneNumber} onChange={handleChange} required />
          </label>

          {message.text ? <p className={`message ${message.type}`}>{message.text}</p> : null}

          <button type="submit" className="submit-button">Đăng ký</button>
        </form>

        <p className="switch-text">
          Đã có tài khoản?{' '}
          <button type="button" className="text-link" onClick={onSwitchToLogin}>
            Đăng nhập
          </button>
        </p>
      </div>
      </div>
    </div>
  )
}

export default Register
