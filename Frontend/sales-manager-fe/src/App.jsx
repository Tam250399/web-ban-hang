import { Suspense, lazy } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import './App.css'
import TrangChu from './components/TrangChu'
import ProductDetailRoute from './components/ProductDetailRoute'
import HomeMeta from './components/HomeMeta'
import Login from './components/Login'
import Register from './components/Register'
import MyOrders from './components/MyOrders'
import ErrorBoundary from './components/common/ErrorBoundary'
import OfflineBanner from './components/common/OfflineBanner'
import RequireAuth from './components/common/RequireAuth'
import { AuthProvider } from './context/AuthContext'
import { NetworkProvider } from './context/NetworkContext'
import { CartProvider } from './context/CartContext'
import { useAuth } from './context/auth-context'
import { DEFAULT_ADMIN_TAB, PATHS } from './routes/paths'

// Khu quản trị gồm 9 panel và là phần nặng nhất của bundle, nhưng chỉ Admin mới
// mở tới. Tách chunk riêng để khách vãng lai vào xem giá không phải tải kèm.
const AdminDashboard = lazy(() => import('./components/AdminDashboard'))

// ChatWidget trả về null với mọi vai trò không phải Customer, nhưng nó kéo theo
// @microsoft/signalr — thư viện nặng nhất dự án. Tải động để khách vãng lai
// (phần lớn lượt truy cập) không phải nhận về thứ họ không dùng.
const ChatWidget = lazy(() => import('./components/common/ChatWidget'))

function RouteLoading({ label }) {
  return (
    <div className="route-loading">
      <div className="spinner" />
      <p>{label}</p>
    </div>
  )
}

// ChatWidget nằm ngoài <Routes> để không bị unmount mỗi lần đổi trang — cuộc
// trò chuyện đang mở phải sống xuyên suốt phiên, không phải tải lại tin nhắn
// mỗi lần khách bấm sang trang khác.
function FloatingChat() {
  const { user } = useAuth()
  if (user?.role !== 'Customer') return null
  return (
    <Suspense fallback={null}>
      <ChatWidget key={user?.id ?? user?.username ?? 'anon'} user={user} />
    </Suspense>
  )
}

function AppRoutes() {
  return (
    <Routes>
      {/* Chi tiết sản phẩm là route CON của trang chủ: TrangChu không bị
          unmount nên giữ nguyên danh sách đã tải và vị trí cuộn, còn URL thì
          chia sẻ được cho khách. */}
      <Route path={PATHS.home} element={<TrangChu />}>
        <Route index element={<HomeMeta />} />
        <Route path="san-pham/:productId" element={<ProductDetailRoute />} />
      </Route>

      <Route path={PATHS.login} element={<Login />} />
      <Route path={PATHS.register} element={<Register />} />

      <Route element={<RequireAuth customerOnly />}>
        <Route path={PATHS.myOrders} element={<MyOrders />} />
      </Route>

      <Route element={<RequireAuth adminOnly />}>
        <Route
          path={PATHS.admin}
          element={<Navigate to={`${PATHS.admin}/${DEFAULT_ADMIN_TAB.slug}`} replace />}
        />
        <Route
          path={`${PATHS.admin}/:tabSlug`}
          element={
            <Suspense fallback={<RouteLoading label="Đang mở trang quản trị..." />}>
              <AdminDashboard />
            </Suspense>
          }
        />
      </Route>

      {/* Đường dẫn lạ (gõ sai, link cũ) đưa về trang chủ thay vì để trang trắng. */}
      <Route path="*" element={<Navigate to={PATHS.home} replace />} />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      {/* Toaster ngoài ErrorBoundary để toast vẫn hiện được khi cây bên trong đã hỏng. */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: { fontFamily: 'inherit', fontSize: '0.92rem', borderRadius: '12px' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#9B360B', secondary: '#fff' } },
        }}
      />
      <ErrorBoundary>
        <NetworkProvider>
          <AuthProvider>
            <CartProvider>
              <OfflineBanner />
              <AppRoutes />
              <FloatingChat />
            </CartProvider>
          </AuthProvider>
        </NetworkProvider>
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
