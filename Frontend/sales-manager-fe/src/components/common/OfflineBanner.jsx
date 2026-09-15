import { useNetwork } from '../../context/network-context'

/**
 * Thanh thông báo trạng thái mất kết nối mạng internet
 */
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
