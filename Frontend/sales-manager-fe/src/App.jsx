import { useEffect, useState } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import './App.css'
import TrangChu from './components/TrangChu'
import Login from './components/Login'
import Register from './components/Register'
import AdminDashboard from './components/AdminDashboard'
import MyOrders from './components/MyOrders'
import ChatWidget from './components/common/ChatWidget'
import { chatService } from './services/chatService'
import { authService } from './services/authService'
import { CartProvider } from './context/CartContext'

const GUEST_USER = { username: 'guest', fullName: 'Khách' }

function App() {
  const [view, setView] = useState('home')
  // Mặc định là khách để trang chủ hiện ngay không cần chờ mạng; nếu có phiên đăng
  // nhập hợp lệ (cookie HttpOnly), state sẽ được nâng cấp ngay sau khi server xác nhận.
  const [user, setUser] = useState(GUEST_USER)

  // Khôi phục phiên đăng nhập bằng cách hỏi thẳng server qua cookie HttpOnly,
  // thay vì tin vào dữ liệu người dùng tự lưu trong localStorage (dễ bị chỉnh sửa qua devtools).
  useEffect(() => {
    authService.me()
      .then((data) => {
        setUser(data)
        localStorage.setItem('salesManagerUser', JSON.stringify(data))
      })
      .catch(() => {
        localStorage.removeItem('salesManagerUser')
      })
  }, [])

  const handleLogout = () => {
    authService.logout().catch(() => {})
    localStorage.removeItem('salesManagerUser')
    chatService.disconnect()
    setUser(GUEST_USER)
    setView('home')
    toast.success('Đã đăng xuất')
  }

  const renderView = () => {
    if (view === 'login') {
      return (
        <Login
          onSwitchToRegister={() => setView('register')}
          onLoginSuccess={(userData) => {
            localStorage.setItem('salesManagerUser', JSON.stringify(userData))
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
    if (view === 'my-orders' && user && user.username !== 'guest') {
      return <MyOrders onBack={() => setView('home')} />
    }
    return (
      <TrangChu
        user={user}
        onLoginClick={() => setView('login')}
        onRegisterClick={() => setView('register')}
        onLogoutClick={handleLogout}
        onAdminClick={() => setView('admin')}
        onMyOrdersClick={() => setView('my-orders')}
      />
    )
  }

  return (
    <CartProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'inherit', fontSize: '0.92rem', borderRadius: '12px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#9B360B', secondary: '#fff' } },
        }}
      />
      {renderView()}
      <ChatWidget key={user?.id ?? user?.username ?? 'anon'} user={user} />
    </CartProvider>
  )
}

export default App
