import { useEffect, useState } from 'react'
import { Toaster } from 'react-hot-toast'
import './App.css'
import TrangChu from './components/TrangChu'
import Login from './components/Login'
import Register from './components/Register'
import AdminDashboard from './components/AdminDashboard'
import ChatWidget from './components/common/ChatWidget'
import { chatService } from './services/chatService'

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
    chatService.disconnect()
    setUser({ username: 'guest', fullName: 'Khách' })
    setView('home')
  }

  const renderView = () => {
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

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'inherit', fontSize: '0.92rem', borderRadius: '12px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      {renderView()}
      <ChatWidget key={user?.id ?? user?.username ?? 'anon'} user={user} />
    </>
  )
}

export default App
