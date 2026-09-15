import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { orderService } from '../../services/orderService'
import Pagination from '../common/Pagination'
import { Icon } from '../common/Icon'

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

function OrderDetailModal({ order, onClose, onConfirm, onCancelClick, confirming }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const totalQuantity = order.items?.reduce((sum, it) => sum + (it.quantity || 0), 0) || 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: 740 }}>
        
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <Icon name="receipt" size={24} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Chi tiết đơn hàng #{order.id}</h3>
                <span className={`order-status-badge ${STATUS_CLASS[order.status]}`}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text)' }}>
                Thời gian đặt: {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'Không rõ'}
                {order.confirmedAt && ` · Xác nhận lúc: ${new Date(order.confirmedAt).toLocaleString('vi-VN')}`}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: '20px 24px' }}>
          
          <div style={{
            background: 'oklch(0.975 0.005 255)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '14px 18px',
            fontSize: '0.88rem'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '10px 20px' }}>
              <div>
                <span style={{ color: 'var(--text)', fontSize: '0.82rem' }}>Người nhận hàng:</span>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  {order.recipientName}
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text)', fontSize: '0.82rem' }}>Số điện thoại:</span>
                <div style={{ fontWeight: 600, marginTop: 2 }}>
                  <a href={`tel:${order.phoneNumber}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                    {order.phoneNumber}
                  </a>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--text)', fontSize: '0.82rem' }}>Địa chỉ nhận hàng:</span>
                <div style={{ fontWeight: 500, marginTop: 2 }}>
                  {order.address || <em style={{ color: '#888' }}>Nhận tại cửa hàng</em>}
                </div>
              </div>

              {order.note && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: 'var(--text)', fontSize: '0.82rem' }}>Ghi chú từ khách:</span>
                  <div style={{ fontStyle: 'italic', marginTop: 2, color: 'var(--ink)' }}>
                    "{order.note}"
                  </div>
                </div>
              )}

              {order.customerUsername && (
                <div>
                  <span style={{ color: 'var(--text)', fontSize: '0.82rem' }}>Tài khoản đặt hàng:</span>
                  <div style={{ fontWeight: 500, marginTop: 2 }}>
                    <code>{order.customerUsername}</code>
                  </div>
                </div>
              )}
            </div>

            {order.cancelReason && (
              <div style={{
                marginTop: 12,
                padding: '8px 12px',
                borderRadius: 6,
                background: 'oklch(0.55 0.19 24 / 0.1)',
                border: '1px solid oklch(0.85 0.08 24)',
                color: 'oklch(0.45 0.18 24)',
                fontSize: '0.84rem'
              }}>
                <strong>Lý do huỷ đơn:</strong> {order.cancelReason}
              </div>
            )}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <strong style={{ fontSize: '0.92rem' }}>
                Danh sách sản phẩm ({order.items?.length || 0})
              </strong>
              <span style={{ fontSize: '0.82rem', color: 'var(--text)' }}>
                Tổng số lượng: <strong>{totalQuantity}</strong>
              </span>
            </div>

            <div className="admin-table-wrap" style={{ minWidth: 0 }}>
              <table className="admin-table" style={{ minWidth: 0, width: '100%' }}>
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th>Tên sản phẩm</th>
                    <th className="text-right" style={{ width: 70 }}>SL</th>
                    <th className="text-right" style={{ width: 130 }}>Đơn giá</th>
                    <th className="text-right" style={{ width: 150 }}>Thành tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((it, i) => {
                    const amount = (it.quantity || 0) * (it.unitPrice || 0)
                    return (
                      <tr key={it.productId || i}>
                        <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{i + 1}</td>
                        <td><strong>{it.productName}</strong></td>
                        <td className="text-right" style={{ fontWeight: 600 }}>{it.quantity}</td>
                        <td className="text-right">{it.unitPrice?.toLocaleString('vi-VN')}đ</td>
                        <td className="price-cell text-right">{amount.toLocaleString('vi-VN')}đ</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 18px',
            background: 'oklch(0.965 0.008 255)',
            borderRadius: 10,
            fontSize: '0.95rem'
          }}>
            <span>Tổng cộng thanh toán:</span>
            <strong className="price-cell" style={{ fontSize: '1.3rem' }}>
              {order.total?.toLocaleString('vi-VN')}đ
            </strong>
          </div>

        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {order.status === 'Pending' && (
              <button
                type="button"
                className="btn-danger-sm"
                style={{ padding: '8px 16px' }}
                onClick={() => onCancelClick?.(order.id)}
              >
                <Icon name="close" size={15} /> Huỷ đơn hàng
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button type="button" className="btn-ghost" onClick={onClose}>Đóng</button>
            {order.status === 'Pending' && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => onConfirm?.(order.id)}
                disabled={confirming}
              >
                {confirming ? 'Đang xác nhận...' : <><Icon name="check" size={16} /> Xác nhận đơn hàng</>}
              </button>
            )}
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
                      {loadingDetailId === o.id ? '...' : <><Icon name="eye" /> Xem</>}
                    </button>
                    {o.status === 'Pending' && (
                      <>
                        <button className="btn-edit-sm" onClick={() => handleConfirm(o.id)} disabled={confirmingId === o.id}>
                          {confirmingId === o.id ? '...' : <><Icon name="check" /> Xác nhận</>}
                        </button>
                        <button className="btn-danger-sm" onClick={() => setCancellingOrderId(o.id)}><Icon name="trash" /> Huỷ</button>
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
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onConfirm={async (id) => {
            await handleConfirm(id)
            setDetailOrder(null)
          }}
          onCancelClick={(id) => {
            setDetailOrder(null)
            setCancellingOrderId(id)
          }}
          confirming={confirmingId === detailOrder.id}
        />
      )}

      {cancellingOrderId && (
        <CancelReasonModal onClose={() => setCancellingOrderId(null)} onConfirm={handleCancel} />
      )}
    </div>
  )
}

export default OrderManager
