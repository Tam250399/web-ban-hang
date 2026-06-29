import { useEffect, useState } from 'react'
import './App.css'
import TrangChu from './components/TrangChu'
import Login from './components/Login'
import Register from './components/Register'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [view, setView] = useState('home')
  const [user, setUser] = useState(null)

  useEffect(() => {
    const savedUser = localStorage.getItem('salesManagerUser')
    const savedToken = localStorage.getItem('salesManagerToken')
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser))
      return
    }
    setUser({ username: 'guest', fullName: 'Khách' })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('salesManagerToken')
    localStorage.removeItem('salesManagerUser')
    setUser({ username: 'guest', fullName: 'Khách' })
    setView('home')
  }

  if (view === 'login') {
    return (
      <Login
        onSwitchToRegister={() => setView('register')}
        onLoginSuccess={(userData) => {
          setUser(userData)
          setView(userData.role === 'Admin' ? 'admin' : 'home')
        }}
      />
    )
  }

  if (view === 'register') {
    return <Register onSwitchToLogin={() => setView('login')} />
  }

  if (view === 'admin' && user?.role === 'Admin') {
    return <AdminDashboard user={user} onBackToHome={() => setView('home')} />
  }

  return (
    <TrangChu
      user={user}
      onLoginClick={() => setView('login')}
      onRegisterClick={() => setView('register')}
      onLogoutClick={handleLogout}
      onAdminClick={() => setView('admin')}
    />
  )
}

export default App
