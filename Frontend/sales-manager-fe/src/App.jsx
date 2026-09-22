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

const AdminDashboard = lazy(() => import('./components/AdminDashboard'))
const ChatWidget = lazy(() => import('./components/common/ChatWidget'))

/**
 * Component RouteLoading
 */
function RouteLoading({ label }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-stone-500">
      <div className="w-10 h-10 border-3 border-stone-200 border-t-primary rounded-full animate-spin" />
      <p className="text-sm font-medium">{label}</p>
    </div>
  )
}

/**
 * Component FloatingChat
 */
function FloatingChat() {
  const { user } = useAuth()
  if (user?.role !== 'Customer') return null
  return (
    <Suspense fallback={null}>
      <ChatWidget key={user?.id ?? user?.username ?? 'anon'} user={user} />
    </Suspense>
  )
}

/**
 * Component AppRoutes
 */
function AppRoutes() {
  return (
    <Routes>
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

      <Route path="*" element={<Navigate to={PATHS.home} replace />} />
    </Routes>
  )
}

/**
 * Component App
 */
function App() {
  return (
    <BrowserRouter>
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
