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

/**
 * Component CancelReasonModal
 */
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
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <Icon name="close" size={18} className="text-red-500" /> Huỷ đơn hàng
          </h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer text-sm font-bold" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="block text-xs sm:text-sm font-semibold text-stone-700">
            <span>Lý do huỷ (tuỳ chọn)</span>
            <input
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="VD: Hết hàng, khách không phản hồi..."
              autoFocus
            />
          </label>
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs sm:text-sm transition cursor-pointer" onClick={onClose}>Đóng</button>
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang huỷ...' : 'Xác nhận huỷ đơn'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Component OrderDetailModal
 */
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
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150" onClick={onClose}>
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Icon name="receipt" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-black text-stone-900">Chi tiết đơn hàng #{order.id}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                  order.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-0.5">
                Thời gian đặt: {order.createdAt ? new Date(order.createdAt).toLocaleString('vi-VN') : 'Không rõ'}
                {order.confirmedAt && ` · Xác nhận lúc: ${new Date(order.confirmedAt).toLocaleString('vi-VN')}`}
              </p>
            </div>
          </div>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer text-sm font-bold" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          <div className="bg-stone-50 rounded-2xl border border-stone-200/80 p-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <span className="text-xs text-stone-400 block">Người nhận hàng:</span>
                <strong className="text-stone-900 font-bold">{order.recipientName}</strong>
              </div>

              <div>
                <span className="text-xs text-stone-400 block">Số điện thoại:</span>
                <a href={`tel:${order.phoneNumber}`} className="text-primary font-bold hover:underline">
                  {order.phoneNumber}
                </a>
              </div>

              <div className="sm:col-span-2">
                <span className="text-xs text-stone-400 block">Địa chỉ nhận hàng:</span>
                <div className="font-medium text-stone-800">
                  {order.address || <span className="text-stone-400 italic">Nhận tại cửa hàng</span>}
                </div>
              </div>

              {order.note && (
                <div className="sm:col-span-2">
                  <span className="text-xs text-stone-400 block">Ghi chú từ khách:</span>
                  <div className="italic text-stone-700 bg-white/75 p-2 rounded-lg border border-stone-200/60 mt-1">
                    "{order.note}"
                  </div>
                </div>
              )}

              {order.customerUsername && (
                <div>
                  <span className="text-xs text-stone-400 block">Tài khoản đặt hàng:</span>
                  <code className="text-xs px-2 py-0.5 rounded bg-stone-200/60 font-mono text-stone-700">{order.customerUsername}</code>
                </div>
              )}
            </div>

            {order.cancelReason && (
              <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                <strong>Lý do huỷ đơn:</strong> {order.cancelReason}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <strong className="text-xs sm:text-sm font-bold text-stone-800">
                Danh sách sản phẩm ({order.items?.length || 0})
              </strong>
              <span className="text-xs text-stone-500">
                Tổng số lượng: <strong className="text-stone-800">{totalQuantity}</strong>
              </span>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                    <th className="px-3.5 py-2.5 w-10">#</th>
                    <th className="px-3.5 py-2.5">Tên sản phẩm</th>
                    <th className="px-3.5 py-2.5 text-right w-16">SL</th>
                    <th className="px-3.5 py-2.5 text-right w-28">Đơn giá</th>
                    <th className="px-3.5 py-2.5 text-right w-32">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {order.items?.map((it, i) => {
                    const amount = (it.quantity || 0) * (it.unitPrice || 0)
                    return (
                      <tr key={it.productId || i} className="hover:bg-stone-50/60 transition">
                        <td className="px-3.5 py-2.5 text-stone-400 text-xs">{i + 1}</td>
                        <td className="px-3.5 py-2.5 font-bold text-stone-900">{it.productName}</td>
                        <td className="px-3.5 py-2.5 text-right font-semibold">{it.quantity}</td>
                        <td className="px-3.5 py-2.5 text-right text-stone-600">{it.unitPrice?.toLocaleString('vi-VN')}đ</td>
                        <td className="px-3.5 py-2.5 text-right font-bold text-primary">{amount.toLocaleString('vi-VN')}đ</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-stone-50 rounded-2xl border border-stone-200/80">
            <span className="text-xs sm:text-sm font-semibold text-stone-700">Tổng cộng thanh toán:</span>
            <strong className="text-lg sm:text-xl font-black text-primary">
              {order.total?.toLocaleString('vi-VN')}đ
            </strong>
          </div>

        </div>

        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-between gap-3">
          <div>
            {order.status === 'Pending' && (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer border border-red-200"
                onClick={() => onCancelClick?.(order.id)}
              >
                <Icon name="close" size={14} /> Huỷ đơn hàng
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs sm:text-sm transition cursor-pointer" onClick={onClose}>Đóng</button>
            {order.status === 'Pending' && (
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
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

/**
 * Component quản lý duyệt đơn đặt hàng của khách hàng
 */
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
      .then(data => {
        const list = Array.isArray(data) ? data : []
        list.sort((a, b) => new Date(b.confirmedAt || b.createdAt || 0) - new Date(a.confirmedAt || a.createdAt || 0) || (b.id || 0) - (a.id || 0))
        setOrders(list)
      })
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
      setOrders(prev => {
        const found = prev.find(o => o.id === id)
        if (!found) return prev
        const updated = { ...found, status: 'Confirmed', confirmedAt: new Date().toISOString() }
        return [updated, ...prev.filter(o => o.id !== id)]
      })
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
      setOrders(prev => {
        const found = prev.find(o => o.id === id)
        if (!found) return prev
        const updated = { ...found, status: 'Cancelled', cancelReason: reason, confirmedAt: new Date().toISOString() }
        return [updated, ...prev.filter(o => o.id !== id)]
      })
      load()
      onChanged?.()
    } catch (err) {
      toast.error(err.message || 'Huỷ đơn thất bại.')
    }
  }

  const sorted = [...orders].sort((a, b) => new Date(b.confirmedAt || b.createdAt || 0) - new Date(a.confirmedAt || a.createdAt || 0) || (b.id || 0) - (a.id || 0))
  const filtered = sorted.filter(o => {
    const matchSearch = !search.trim() || o.recipientName?.toLowerCase().includes(search.trim().toLowerCase()) || o.phoneNumber?.includes(search.trim())
    const oDate = o.createdAt ? o.createdAt.slice(0, 10) : ''
    const matchFrom = !fromDate || oDate >= fromDate
    const matchTo = !toDate || oDate <= toDate
    return matchSearch && matchFrom && matchTo
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
          Đơn hàng online
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {filtered.length}
          </span>
        </h3>
      </div>

      <div className="inline-flex p-1 bg-white rounded-2xl border border-stone-200/80 shadow-2xs gap-1 flex-wrap">
        {FILTERS.map(f => (
          <button
            key={f.key}
            className={`inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              filter === f.key
                ? 'bg-primary text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
            onClick={() => changeFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            placeholder="Tìm theo người nhận, SĐT..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
            showAdvanced
              ? 'bg-stone-800 text-white border-stone-800'
              : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
          }`}
          onClick={() => setShowAdvanced(v => !v)}
        >
          <Icon name="chevronDown" size={14} className={`transition-transform duration-150 ${showAdvanced ? 'rotate-180' : ''}`} />
          Nâng cao
          {[fromDate, toDate].filter(Boolean).length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-primary text-white">
              {[fromDate, toDate].filter(Boolean).length}
            </span>
          )}
        </button>
        {(search || fromDate || toDate) && (
          <button
            type="button"
            className="px-3 py-2 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 text-xs font-bold transition cursor-pointer"
            onClick={() => { setSearch(''); setFromDate(''); setToDate(''); setPage(1) }}
          >
            Xóa lọc
          </button>
        )}
      </div>

      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-white rounded-2xl border border-stone-200/80 shadow-2xs">
          <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-700">
            <span>Từ ngày:</span>
            <input
              type="date"
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1) }}
            />
          </label>
          <label className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-700">
            <span>Đến ngày:</span>
            <input
              type="date"
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-stone-800 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1) }}
            />
          </label>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="px-3.5 py-2.5">#</th>
              <th className="px-3.5 py-2.5">Ngày</th>
              <th className="px-3.5 py-2.5">Người nhận</th>
              <th className="px-3.5 py-2.5">SL sản phẩm</th>
              <th className="px-3.5 py-2.5">Tổng tiền</th>
              <th className="px-3.5 py-2.5">Trạng thái</th>
              <th className="px-3.5 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading ? (
              <tr><td colSpan={7} className="text-center py-12 text-stone-400 text-xs sm:text-sm">Đang tải...</td></tr>
            ) : paginated.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-12 text-stone-400 text-xs sm:text-sm">Chưa có đơn hàng nào</td></tr>
            ) : paginated.map((o, i) => (
              <tr key={o.id} className="hover:bg-stone-50/60 transition">
                <td className="px-3.5 py-2 text-stone-400 text-xs">{(page - 1) * pageSize + i + 1}</td>
                <td className="px-3.5 py-2 text-stone-600">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
                <td className="px-3.5 py-2">
                  <strong className="text-stone-900 block font-bold">{o.recipientName}</strong>
                  <span className="text-[11px] text-stone-400">{o.phoneNumber}</span>
                </td>
                <td className="px-3.5 py-2 text-stone-600 font-semibold">{o.itemCount}</td>
                <td className="px-3.5 py-2 font-bold text-primary">{o.total?.toLocaleString('vi-VN')}đ</td>
                <td className="px-3.5 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    o.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    o.status === 'Cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                    'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </td>
                <td className="px-3.5 py-2 text-right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-100 text-stone-800 hover:bg-stone-200 transition cursor-pointer border border-stone-200"
                      onClick={() => openDetail(o.id)}
                      disabled={loadingDetailId === o.id}
                    >
                      {loadingDetailId === o.id ? '...' : <><Icon name="eye" size={13} /> Xem</>}
                    </button>
                    {o.status === 'Pending' && (
                      <>
                        <button
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition cursor-pointer border border-emerald-200"
                          onClick={() => handleConfirm(o.id)}
                          disabled={confirmingId === o.id}
                        >
                          {confirmingId === o.id ? '...' : <><Icon name="check" size={13} /> Xác nhận</>}
                        </button>
                        <button
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer border border-red-200"
                          onClick={() => setCancellingOrderId(o.id)}
                        >
                          <Icon name="trash" size={13} /> Huỷ
                        </button>
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
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        label="đơn hàng"
        onPage={setPage}
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
