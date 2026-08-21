import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/auth-context'
import { ADMIN_ORDERS_TAB, PATHS } from '../../routes/paths'

/**
 * Chặn route cần đăng nhập (và tuỳ chọn: cần quyền Admin, hoặc chỉ dành cho
 * khách hàng).
 *
 * Điểm mấu chốt là nhánh `restoring`: phiên đăng nhập được khôi phục bằng một
 * request /auth/me, trước khi nó trả về thì user vẫn là khách. Nếu điều hướng
 * ngay lúc đó, admin bấm F5 ở /quan-tri sẽ bị đá về màn đăng nhập dù phiên còn
 * hiệu lực hoàn toàn.
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
    // Ghi lại nơi định đến để sau khi đăng nhập quay lại đúng chỗ đó.
    return <Navigate to={PATHS.login} replace state={{ from: location }} />
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to={PATHS.home} replace />
  }

  // Admin không có luồng mua hàng nên "Đơn hàng của tôi" luôn rỗng với họ —
  // đưa thẳng sang khu quản lý đơn hàng online cho đỡ mất công.
  if (customerOnly && isAdmin) {
    return <Navigate to={PATHS.adminTab(ADMIN_ORDERS_TAB.slug)} replace />
  }

  return <Outlet />
}

export default RequireAuth
