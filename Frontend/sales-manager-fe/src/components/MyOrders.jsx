import { useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import '../App.css'
import { orderService } from '../services/orderService'
import { useCachedResource } from '../hooks/useCachedResource'
import { useRequireOnline } from '../hooks/useRequireOnline'
import { CACHE_KEYS, formatCacheAge } from '../services/cache'
import PageMeta from './common/PageMeta'
import ConfirmModal from './common/ConfirmModal'
import LogoBadge from './LogoBadge'
import { PATHS } from '../routes/paths'
import { Icon } from './common/Icon'

const STATUS_LABEL = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã huỷ' }
const STATUS_CLASS = { Pending: 'pending', Confirmed: 'confirmed', Cancelled: 'cancelled' }

function MyOrders() {
  const requireOnline = useRequireOnline()
  const [cancellingId, setCancellingId] = useState(null)
  const [reorderingId, setReorderingId] = useState(null)
  const [confirmCancelOrder, setConfirmCancelOrder] = useState(null)

  const {
    data,
    loading,
    isStale,
    cachedAt,
    isOnline,
    reload,
  } = useCachedResource(CACHE_KEYS.myOrders, () => orderService.getMine())

  const orders = data ?? []

  const handleCancel = async (id) => {
    setConfirmCancelOrder(null)
    if (!requireOnline('Hủy đơn hàng')) return
    setCancellingId(id)
    try {
      await orderService.cancel(id, {})
      toast.success('Đã huỷ đơn hàng.')
      reload()
    } catch (err) {
      toast.error(err.message || 'Huỷ đơn thất bại.')
    }
    setCancellingId(null)
  }

  const handleReorder = async (id) => {
    if (!requireOnline('Đặt lại đơn hàng')) return
    setReorderingId(id)
    try {
      const res = await orderService.reorder(id)
      toast.success(res.message || 'Đã đặt lại đơn hàng.')
      reload()
    } catch (err) {
      toast.error(err.message || 'Không đặt lại được đơn hàng.')
    }
    setReorderingId(null)
  }

  return (
    <div className="site-wrapper">
      <PageMeta title="Đơn hàng của tôi" noIndex />
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon"><LogoBadge size={40} variant="reversed" /></div>
            <div>
              <strong>Đơn hàng của tôi</strong>
              <span>Cửa Hàng VLXD Lý Sáu</span>
            </div>
          </div>
          <div className="header-actions">
            <Link className="btn-ghost" to={PATHS.home}>← Về trang chủ</Link>
          </div>
        </div>
      </header>

      <div className="hzd" />

      <div className="my-orders-page">
        {isStale && !loading && (
          <div className="stale-bar" role="status">
            {isOnline
              ? `Chưa cập nhật được — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`
              : `Đang ngoại tuyến — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`}
          </div>
        )}

        {loading ? (
          <div className="loading-state"><div className="spinner" /><p>Đang tải đơn hàng...</p></div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            {!isOnline ? (
              <>
                <p><strong>Chưa có dữ liệu ngoại tuyến</strong></p>
                <p>Kết nối mạng một lần để tải đơn hàng về máy, sau đó vẫn tra cứu được khi mất sóng.</p>
              </>
            ) : (
              <p>Bạn chưa có đơn hàng nào. Hãy chọn sản phẩm và đặt hàng nhé!</p>
            )}
          </div>
        ) : (
          <div className="my-orders-list">
            {orders.map(o => (
              <div className="order-card" key={o.id}>
                <div className="order-card-header">
                  <span>Đơn #{o.id} · {new Date(o.createdAt).toLocaleDateString('vi-VN')}</span>
                  <span className={`order-status-badge ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                </div>

                <div className="order-card-delivery">
                  <span className="order-card-delivery-label">Giao tới</span>
                  <span>{o.recipientName} · {o.phoneNumber}</span>
                  {o.address && <span className="order-card-address">{o.address}</span>}
                </div>

                <div className="order-card-items">
                  {o.items.map((it, idx) => (
                    <div key={idx} className="order-card-item">
                      <span>{it.productName} <span className="order-card-item-qty">× {it.quantity}</span></span>
                      <span>{(it.quantity * it.unitPrice).toLocaleString('vi-VN')}đ</span>
                    </div>
                  ))}
                </div>

                <div className="order-card-total-row">
                  <span>Tổng cộng</span>
                  <strong>{o.total.toLocaleString('vi-VN')}đ</strong>
                </div>

                {o.status === 'Cancelled' && o.cancelReason && (
                  <p className="order-cancel-reason">Lý do huỷ: {o.cancelReason}</p>
                )}
                {o.status === 'Pending' && (
                  <div className="order-card-footer">
                    <button
                      className="btn-danger-sm"
                      onClick={() => setConfirmCancelOrder(o)}
                      disabled={cancellingId === o.id}
                    >
                      {cancellingId === o.id ? 'Đang huỷ...' : 'Huỷ đơn'}
                    </button>
                  </div>
                )}
                {o.status === 'Cancelled' && (
                  <div className="order-card-footer">
                    <button
                      className="btn-edit-sm"
                      onClick={() => handleReorder(o.id)}
                      disabled={reorderingId === o.id}
                    >
                      {reorderingId === o.id ? 'Đang xử lý...' : <><Icon name="refresh" /> Đặt lại đơn</>}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmCancelOrder && (
        <ConfirmModal
          icon={<Icon name="alert" size={30} />}
          title="Huỷ đơn hàng?"
          message={`Đơn #${confirmCancelOrder.id} trị giá ${confirmCancelOrder.total?.toLocaleString('vi-VN')}đ sẽ được huỷ.`}
          warning="Bạn vẫn có thể đặt lại đơn này sau."
          confirmLabel="Huỷ đơn"
          cancelLabel="Không huỷ"
          onConfirm={() => handleCancel(confirmCancelOrder.id)}
          onCancel={() => setConfirmCancelOrder(null)}
        />
      )}
    </div>
  )
}

export default MyOrders
