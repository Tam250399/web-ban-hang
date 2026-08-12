import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import '../App.css'
import { orderService } from '../services/orderService'

const STATUS_LABEL = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã huỷ' }
const STATUS_CLASS = { Pending: 'pending', Confirmed: 'confirmed', Cancelled: 'cancelled' }

function MyOrders({ onBack }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
  const [reorderingId, setReorderingId] = useState(null)

  const load = () => {
    orderService.getMine()
      .then(setOrders)
      .catch(() => toast.error('Không tải được danh sách đơn hàng.'))
      .finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleCancel = async (id) => {
    setCancellingId(id)
    try {
      await orderService.cancel(id, {})
      toast.success('Đã huỷ đơn hàng.')
      load()
    } catch (err) {
      toast.error(err.message || 'Huỷ đơn thất bại.')
    }
    setCancellingId(null)
  }

  // Đặt lại đơn đã huỷ: cập nhật lại CHÍNH đơn đó về Pending (không tạo đơn mới),
  // giá được backend làm mới theo giá hiện tại, sản phẩm hết hàng sẽ tự bị loại.
  const handleReorder = async (id) => {
    setReorderingId(id)
    try {
      const res = await orderService.reorder(id)
      toast.success(res.message || 'Đã đặt lại đơn hàng.')
      load()
    } catch (err) {
      toast.error(err.message || 'Không đặt lại được đơn hàng.')
    }
    setReorderingId(null)
  }

  return (
    <div className="site-wrapper">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon">ĐL</div>
            <div>
              <strong>Đơn hàng của tôi</strong>
              <span>Cửa Hàng VLXD Đức Lợi</span>
            </div>
          </div>
          <div className="header-actions">
            <button className="btn-ghost" onClick={onBack}>← Về trang chủ</button>
          </div>
        </div>
      </header>

      <div className="hzd" />

      <div className="my-orders-page">
        {loading ? (
          <div className="loading-state"><div className="spinner" /><p>Đang tải đơn hàng...</p></div>
        ) : orders.length === 0 ? (
          <div className="empty-state"><p>Bạn chưa có đơn hàng nào. Hãy chọn sản phẩm và đặt hàng nhé!</p></div>
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
                      onClick={() => handleCancel(o.id)}
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
                      {reorderingId === o.id ? 'Đang xử lý...' : '🔁 Đặt lại đơn'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyOrders
