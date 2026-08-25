import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { orderService } from '../../services/orderService'
import Pagination from '../common/Pagination'

const STATUS_LABEL = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã huỷ' }
const STATUS_CLASS = { Pending: 'pending', Confirmed: 'confirmed', Cancelled: 'cancelled' }
const FILTERS = [
  { key: '', label: 'Tất cả' },
  { key: 'Pending', label: 'Chờ xác nhận' },
  { key: 'Confirmed', label: 'Đã xác nhận' },
  { key: 'Cancelled', label: 'Đã huỷ' },
]

function CancelReasonModal({ onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await onConfirm(reason.trim() || null)
    setLoading(false)
  }

  return (
    // Không đóng khi bấm ra ngoài: form nhập lý do huỷ đơn rất dễ bị tắt nhầm
    // khi đang thao tác, chỉ đóng qua nút ✕ hoặc sau khi lưu thành công.
    <div className="modal-overlay">
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Huỷ đơn hàng</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="add-product-form">
          <label className="form-field">
            <span>Lý do huỷ (tuỳ chọn)</span>
            <input value={reason} onChange={e => setReason(e.target.value)} placeholder="VD: Hết hàng, khách không phản hồi..." autoFocus />
          </label>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Đóng</button>
            <button className="btn-danger" type="submit" disabled={loading}>
              {loading ? 'Đang huỷ...' : 'Xác nhận huỷ đơn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function OrderDetailModal({ order, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Đơn hàng #{order.id}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <div style={{ padding: '4px 24px 20px' }}>
          <p><strong>Người nhận:</strong> {order.recipientName} · {order.phoneNumber}</p>
          {order.address && <p><strong>Địa chỉ:</strong> {order.address}</p>}
          {order.note && <p><strong>Ghi chú:</strong> {order.note}</p>}
          {order.customerUsername && <p><strong>Tài khoản:</strong> {order.customerUsername}</p>}
          <p><strong>Trạng thái:</strong> <span className={`order-status-badge ${STATUS_CLASS[order.status]}`}>{STATUS_LABEL[order.status]}</span></p>
          {order.cancelReason && <p><strong>Lý do huỷ:</strong> {order.cancelReason}</p>}

          <div className="admin-table-wrap" style={{ marginTop: 14 }}>
            <table className="admin-table">
              <thead><tr><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
              <tbody>
                {order.items?.map((it, i) => (
                  <tr key={i}>
                    <td>{it.productName}</td>
                    <td>{it.quantity}</td>
                    <td>{it.unitPrice?.toLocaleString('vi-VN')}đ</td>
                    <td>{(it.quantity * it.unitPrice).toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="cart-total-row" style={{ padding: '14px 0 0' }}>
            <span>Tổng cộng</span>
            <strong>{order.total?.toLocaleString('vi-VN')}đ</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderManager({ onChanged }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [detailOrder, setDetailOrder] = useState(null)
  const [loadingDetailId, setLoadingDetailId] = useState(null)
  const [confirmingId, setConfirmingId] = useState(null)
  const [cancellingOrderId, setCancellingOrderId] = useState(null)

  // Danh sách (GetAll) không kèm chi tiết sản phẩm — phải gọi GetById riêng để lấy đủ items.
  const openDetail = async (id) => {
    setLoadingDetailId(id)
    try {
      const full = await orderService.getById(id)
      setDetailOrder(full)
    } catch (err) {
      toast.error(err.message || 'Không tải được chi tiết đơn hàng.')
    }
    setLoadingDetailId(null)
  }

  const load = useCallback(() => {
    orderService.getAll(filter)
      .then(setOrders)
      .catch(() => toast.error('Không tải được danh sách đơn hàng.'))
      .finally(() => setLoading(false))
  }, [filter])
  useEffect(() => { load() }, [load])
  const changeFilter = (key) => { setFilter(key); setPage(1); setLoading(true) }

  const handleConfirm = async (id) => {
    setConfirmingId(id)
    try {
      // preparedByName do backend tự điền từ danh tính đã xác thực.
      await orderService.confirm(id, {})
      toast.success('Đã xác nhận đơn hàng và tạo phiếu bán hàng!')
      load()
      onChanged?.()
    } catch (err) {
      toast.error(err.message || 'Xác nhận thất bại.')
    }
    setConfirmingId(null)
  }

  const handleCancel = async (reason) => {
    const id = cancellingOrderId
    try {
      await orderService.cancel(id, { reason })
      toast.success('Đã huỷ đơn hàng.')
      setCancellingOrderId(null)
      load()
      onChanged?.()
    } catch (err) {
      toast.error(err.message || 'Huỷ đơn thất bại.')
    }
  }

  const filtered = orders.filter(o => {
    const matchSearch = !search.trim() || o.recipientName?.toLowerCase().includes(search.trim().toLowerCase()) || o.phoneNumber?.includes(search.trim())
    const oDate = o.createdAt ? o.createdAt.slice(0, 10) : ''
    const matchFrom = !fromDate || oDate >= fromDate
    const matchTo = !toDate || oDate <= toDate
    return matchSearch && matchFrom && matchTo
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div>
      <div className="list-header">
        <h3 className="tab-title" style={{ marginBottom: 0 }}>
          Đơn hàng online
          <span className="count-badge" style={{ marginLeft: 8 }}>{filtered.length}</span>
        </h3>
      </div>

      <div className="sub-tabs">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`sub-tab-btn ${filter === f.key ? 'active' : ''}`}
            onClick={() => changeFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="admin-filter-bar" style={{ marginTop: 16 }}>
        <input
          className="search-input"
          placeholder="Tìm theo người nhận, SĐT..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <button
          type="button"
          className={`btn-advanced-toggle ${showAdvanced ? 'active' : ''}`}
          onClick={() => setShowAdvanced(v => !v)}
        >
          <span className="toggle-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span> Nâng cao
          {[fromDate, toDate].filter(Boolean).length > 0 && (
            <span className="advanced-count">{[fromDate, toDate].filter(Boolean).length}</span>
          )}
        </button>
        {(search || fromDate || toDate) && (
          <button type="button" className="btn-ghost" onClick={() => { setSearch(''); setFromDate(''); setToDate(''); setPage(1) }}>Xóa lọc</button>
        )}
      </div>
      {showAdvanced && (
        <div className="advanced-filter-panel">
          <label className="admin-filter-date">
            <span>Từ ngày</span>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }} />
          </label>
          <label className="admin-filter-date">
            <span>Đến ngày</span>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }} />
          </label>
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Ngày</th><th>Người nhận</th><th>SL sản phẩm</th><th>Tổng tiền</th><th>Trạng thái</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>Đang tải...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-light)' }}>Chưa có đơn hàng nào</td></tr>
            ) : paginated.map((o, i) => (
              <tr key={o.id}>
                <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                <td>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                <td><strong>{o.recipientName}</strong><br /><span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>{o.phoneNumber}</span></td>
                <td>{o.itemCount}</td>
                <td><strong>{o.total?.toLocaleString('vi-VN')}đ</strong></td>
                <td><span className={`order-status-badge ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span></td>
                <td>
                  <div className="action-btns">
                    <button className="btn-edit-sm" onClick={() => openDetail(o.id)} disabled={loadingDetailId === o.id}>
                      {loadingDetailId === o.id ? '...' : '👁️ Xem'}
                    </button>
                    {o.status === 'Pending' && (
                      <>
                        <button className="btn-edit-sm" onClick={() => handleConfirm(o.id)} disabled={confirmingId === o.id}>
                          {confirmingId === o.id ? '...' : '✅ Xác nhận'}
                        </button>
                        <button className="btn-danger-sm" onClick={() => setCancellingOrderId(o.id)}>🗑️ Huỷ</button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page} totalPages={totalPages} total={filtered.length} pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        label="đơn hàng" onPage={setPage}
      />

      {detailOrder && (
        <OrderDetailModal order={detailOrder} onClose={() => setDetailOrder(null)} />
      )}

      {cancellingOrderId && (
        <CancelReasonModal onClose={() => setCancellingOrderId(null)} onConfirm={handleCancel} />
      )}
    </div>
  )
}

export default OrderManager
