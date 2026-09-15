import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { ADMIN_ORDERS_TAB, PATHS } from '../../routes/paths'

/**
 * Component bọc bảo vệ yêu cầu đăng nhập trước khi truy cập
 */
function RequireAuth({ adminOnly = false, customerOnly = false }) {
  const { isLoggedIn, isAdmin, restoring } = useAuth()
  const location = useLocation()

  if (restoring) {
    return (
      <div className="route-loading">
        <div className="spinner" />
        <p>Đang kiểm tra phiên đăng nhập...</p>
      </div>
    )
  }

  if (!isLoggedIn) {
    return <Navigate to={PATHS.login} replace state={{ from: location }} />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to={PATHS.home} replace />
  }

  if (customerOnly && isAdmin) {
    return <Navigate to={PATHS.adminTab(ADMIN_ORDERS_TAB.slug)} replace />
  }

  return <Outlet />
}

export default RequireAuth
