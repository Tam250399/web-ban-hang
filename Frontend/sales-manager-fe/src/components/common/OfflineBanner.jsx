import { useNetwork } from '../../context/network-context'
import { Icon } from './Icon'

/**
 * Thanh thông báo trạng thái mất kết nối mạng internet
 */
function OfflineBanner() {
  const { isOnline } = useNetwork()
  if (isOnline) return null

  return (
    <div
      className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-500 px-4 py-2.5 text-center text-sm font-semibold text-white shadow-md"
      role="status"
      aria-live="polite"
    >
      <Icon name="alert" size={16} />
      <span>Mất kết nối mạng — đang hiển thị dữ liệu đã lưu trên máy</span>
    </div>
  )
}

export default OfflineBanner
