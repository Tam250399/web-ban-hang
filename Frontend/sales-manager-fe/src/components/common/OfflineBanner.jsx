import { useNetwork } from '../../context/network-context'

// Dải báo mất mạng cố định trên cùng. Trạng thái lấy từ NetworkProvider để cả
// app chỉ có một nguồn sự thật về mạng.
function OfflineBanner() {
  const { isOnline } = useNetwork()
  if (isOnline) return null

  return (
    <div className="offline-banner" role="status" aria-live="polite">
      Mất kết nối mạng — đang hiển thị dữ liệu đã lưu trên máy
    </div>
  )
}

export default OfflineBanner
