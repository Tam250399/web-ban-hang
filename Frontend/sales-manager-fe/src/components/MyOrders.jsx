import { useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import '../App.css'
import { orderService } from '../services/orderService'
import { useCachedResource } from '../hooks/useCachedResource'
import { useRequireOnline } from '../hooks/useRequireOnline'
import { useModalA11y } from '../hooks/useModalA11y'
import { CACHE_KEYS, formatCacheAge } from '../services/cache'
import PageMeta from './common/PageMeta'
import ConfirmModal from './common/ConfirmModal'
import Pagination from './common/Pagination'
import LogoBadge from './LogoBadge'
import { PATHS } from '../routes/paths'
import { Icon } from './common/Icon'

const STATUS_CONFIG = {
  Pending: { label: 'Chờ xác nhận', badgeClass: 'bg-amber-100 text-amber-900 border border-amber-300/60' },
  Confirmed: { label: 'Đã xác nhận', badgeClass: 'bg-emerald-100 text-emerald-800 border border-emerald-300/60' },
  Cancelled: { label: 'Đã huỷ', badgeClass: 'bg-red-100 text-red-700 border border-red-300/60' },
}

/**
 * Hộp thoại hiển thị chi tiết toàn bộ thông tin đơn hàng
 */
function OrderDetailModal({ order, onClose, onCancel, onReorder, cancellingId, reorderingId }) {
  const backdropRef = useRef(null)
  const isClosingRef = useRef(false)

  const handleAnimatedClose = () => {
    if (isClosingRef.current) return
    isClosingRef.current = true

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !dialogRef.current || !backdropRef.current) {
      isClosingRef.current = false
      onClose()
      return
    }

    const tl = gsap.timeline({
      onComplete: () => {
        isClosingRef.current = false
        onClose()
      },
    })
    tl.to(dialogRef.current, { scale: 0.95, y: 12, opacity: 0, duration: 0.2, ease: 'power2.in' }, 0)
      .to(backdropRef.current, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0)
  }

  const dialogRef = useModalA11y({ onClose: handleAnimatedClose })

  useGSAP(() => {
    if (!order) return
    isClosingRef.current = false
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return

    if (backdropRef.current) {
      gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' })
    }
    if (dialogRef.current) {
      gsap.fromTo(
        dialogRef.current,
        { scale: 0.94, y: 16, opacity: 0 },
        { scale: 1, y: 0, opacity: 1, duration: 0.32, ease: 'back.out(1.2)' }
      )
    }
  }, { dependencies: [order?.id], scope: backdropRef })

  if (!order) return null

  const statusCfg = STATUS_CONFIG[order.status] || {
    label: order.status,
    badgeClass: 'bg-neutral-100 text-neutral-800 border border-neutral-300/60',
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={handleAnimatedClose}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-brand-divider/70 flex flex-col max-h-[90vh] will-change-transform"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-detail-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-divider/60 bg-neutral-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Icon name="receipt" size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="order-detail-title" className="text-lg font-black font-display text-ink">
                  Chi tiết đơn hàng #{order.id}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${statusCfg.badgeClass}`}>
                  {statusCfg.label}
                </span>
              </div>
              <p className="text-xs text-brand-text">
                Đặt lúc: {new Date(order.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
          </div>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-ink hover:bg-neutral-200 transition cursor-pointer text-sm font-bold"
            onClick={handleAnimatedClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Thông tin người nhận & Địa chỉ */}
          <div className="p-4 rounded-2xl bg-neutral-50/80 border border-brand-divider/60 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text flex items-center gap-1.5">
              <Icon name="pin" size={14} className="text-primary" />
              <span>Thông tin giao nhận</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
              <div>
                <span className="text-stone-500 block text-[11px]">Người nhận:</span>
                <strong className="text-ink font-semibold">{order.recipientName}</strong>
              </div>
              <div>
                <span className="text-stone-500 block text-[11px]">Số điện thoại:</span>
                <span className="font-semibold text-ink font-mono">{order.phoneNumber}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-stone-500 block text-[11px]">Địa chỉ giao hàng:</span>
                <span className="text-ink">{order.address || 'Không ghi nhận'}</span>
              </div>
              {order.note && (
                <div className="sm:col-span-2">
                  <span className="text-stone-500 block text-[11px]">Ghi chú đơn hàng:</span>
                  <span className="text-ink italic bg-white px-2.5 py-1.5 rounded-lg border border-brand-divider/40 block mt-0.5">
                    {order.note}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Lý do hủy nếu có */}
          {order.status === 'Cancelled' && order.cancelReason && (
            <div className="p-3.5 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-800 flex items-start gap-2">
              <Icon name="alert" size={16} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-bold">Lý do huỷ đơn:</strong> {order.cancelReason}
              </div>
            </div>
          )}

          {/* Bảng danh sách sản phẩm */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-brand-text mb-2.5 flex items-center gap-1.5">
              <Icon name="box" size={14} className="text-primary" />
              <span>Danh sách sản phẩm ({order.items?.length || 0})</span>
            </h4>
            <div className="border border-brand-divider/60 rounded-2xl overflow-hidden bg-white shadow-2xs">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50/80 border-b border-brand-divider/50 text-[11px] font-bold text-brand-text uppercase tracking-wider">
                    <th className="py-2.5 px-3">Sản phẩm</th>
                    <th className="py-2.5 px-3 text-center">Số lượng</th>
                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-divider/30">
                  {order.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-neutral-50/50 transition">
                      <td className="py-3 px-3">
                        <strong className="text-ink block">{item.productName}</strong>
                        {item.unit && <span className="text-[11px] text-stone-500">ĐVT: {item.unit}</span>}
                      </td>
                      <td className="py-3 px-3 text-center font-bold font-mono text-ink">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right text-stone-600 font-mono">
                        {item.unitPrice?.toLocaleString('vi-VN')}đ
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-ink font-mono">
                        {(item.quantity * item.unitPrice)?.toLocaleString('vi-VN')}đ
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-neutral-50/90 border-t border-brand-divider/60">
                    <td colSpan={3} className="py-3 px-3 font-bold text-ink uppercase text-xs">
                      Tổng tiền thanh toán:
                    </td>
                    <td className="py-3 px-3 text-right font-black font-display text-lg text-primary">
                      {order.total?.toLocaleString('vi-VN')}đ
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 bg-neutral-50/80 border-t border-brand-divider/60 flex flex-wrap items-center justify-between gap-3">
          <div>
            {order.status === 'Pending' && (
              <button
                type="button"
                className="px-4 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                onClick={() => {
                  onClose()
                  onCancel(order)
                }}
                disabled={cancellingId === order.id}
              >
                {cancellingId === order.id ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              className="px-4 py-2 rounded-xl border border-brand-divider text-ink hover:bg-neutral-100 text-xs font-bold transition cursor-pointer"
              onClick={onClose}
            >
              Đóng
            </button>
            <button
              type="button"
              className="px-5 py-2 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold font-display shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              onClick={() => onReorder(order.id)}
              disabled={reorderingId === order.id}
            >
              {reorderingId === order.id ? (
                'Đang xử lý...'
              ) : (
                <>
                  <Icon name="refresh" size={14} />
                  <span>Đặt lại đơn hàng này</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Màn hình danh sách đơn hàng dạng Bảng (Table), hỗ trợ Phân trang, Xem chi tiết và Đặt lại đơn
 */
function MyOrders() {
  const requireOnline = useRequireOnline()
  const [cancellingId, setCancellingId] = useState(null)
  const [reorderingId, setReorderingId] = useState(null)
  const [confirmCancelOrder, setConfirmCancelOrder] = useState(null)
  const [detailOrder, setDetailOrder] = useState(null)

  // Bộ lọc & Phân trang
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'Pending' | 'Confirmed' | 'Cancelled'
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const {
    data,
    loading,
    isStale,
    cachedAt,
    isOnline,
    reload,
  } = useCachedResource(CACHE_KEYS.myOrders, () => orderService.getMine())

  const rawOrders = useMemo(() => {
    return [...(data ?? [])].sort(
      (a, b) =>
        new Date(b.confirmedAt || b.createdAt || 0) - new Date(a.confirmedAt || a.createdAt || 0) ||
        (b.id || 0) - (a.id || 0)
    )
  }, [data])

  // Lọc theo trạng thái và từ khóa tìm kiếm
  const filteredOrders = useMemo(() => {
    return rawOrders.filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim()
        const matchesId = String(o.id).includes(query)
        const matchesName = o.recipientName?.toLowerCase().includes(query)
        const matchesPhone = o.phoneNumber?.includes(query)
        const matchesProduct = o.items?.some((it) => it.productName?.toLowerCase().includes(query))
        return matchesId || matchesName || matchesPhone || matchesProduct
      }
      return true
    })
  }, [rawOrders, statusFilter, searchTerm])

  const totalPages = Math.ceil(filteredOrders.length / pageSize) || 1

  // Cắt trang cho bảng
  const pagedOrders = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, page, pageSize])

  const tableBodyRef = useRef(null)

  useGSAP(() => {
    if (!tableBodyRef.current) return
    const rows = tableBodyRef.current.querySelectorAll('[data-order-row]')
    if (rows.length === 0) return

    gsap.fromTo(
      rows,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.35,
        stagger: 0.04,
        ease: 'power2.out',
        clearProps: 'transform,opacity',
      }
    )
  }, { dependencies: [statusFilter, page, pagedOrders.length], scope: tableBodyRef })

  const handleCancel = async (id) => {
    setConfirmCancelOrder(null)
    if (!requireOnline('Hủy đơn hàng')) return
    setCancellingId(id)
    try {
      await orderService.cancel(id, {})
      toast.success('Đã huỷ đơn hàng.')
      reload()
      if (detailOrder?.id === id) {
        setDetailOrder(null)
      }
    } catch (err) {
      toast.error(err.message || 'Huỷ đơn thất bại.')
    } finally {
      setCancellingId(null)
    }
  }

  const handleReorder = async (id) => {
    if (!requireOnline('Đặt lại đơn hàng')) return
    setReorderingId(id)
    try {
      const res = await orderService.reorder(id)
      toast.success(res.message || 'Đã đặt lại đơn hàng thành công!')
      reload()
    } catch (err) {
      toast.error(err.message || 'Không đặt lại được đơn hàng.')
    } finally {
      setReorderingId(null)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-ink">
      <PageMeta title="Đơn hàng của tôi" noIndex />
      <header className="sticky top-0 z-40 bg-brand-bg/95 backdrop-blur-md border-b border-brand-divider/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 select-none">
            <div className="shrink-0">
              <LogoBadge size={40} variant="reversed" />
            </div>
            <div>
              <strong className="block text-base font-extrabold font-display leading-tight text-ink">
                Đơn hàng của tôi
              </strong>
              <span className="block text-[11px] text-brand-text">Cửa Hàng VLXD Lý Sáu</span>
            </div>
          </div>
          <div>
            <Link
              viewTransition
              className="px-3.5 py-2 rounded-xl border border-brand-divider hover:bg-neutral-100 text-xs font-bold text-ink transition inline-flex items-center gap-1.5"
              to={PATHS.home}
            >
              ← Về trang chủ
            </Link>
          </div>
        </div>
      </header>

      <div className="hzd" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 w-full flex-1">
        {isStale && !loading && (
          <div
            className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium"
            role="status"
          >
            {isOnline
              ? `Chưa cập nhật được — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`
              : `Đang ngoại tuyến — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`}
          </div>
        )}

        {/* Thanh công cụ: Tìm kiếm & Lọc trạng thái */}
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Tabs bộ lọc */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'ALL', label: 'Tất cả', count: rawOrders.length },
              { key: 'Pending', label: 'Chờ xác nhận', count: rawOrders.filter((o) => o.status === 'Pending').length },
              { key: 'Confirmed', label: 'Đã xác nhận', count: rawOrders.filter((o) => o.status === 'Confirmed').length },
              { key: 'Cancelled', label: 'Đã huỷ', count: rawOrders.filter((o) => o.status === 'Cancelled').length },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key)
                  setPage(1)
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-ink text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-brand-divider/70 hover:bg-neutral-50'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-neutral-100 text-stone-600'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Ô tìm kiếm */}
          <div className="relative w-full sm:w-64">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                setPage(1)
              }}
              placeholder="Tìm mã đơn, tên hàng, SĐT..."
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-brand-divider/80 bg-white text-xs text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('')
                  setPage(1)
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-ink text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Nội dung danh sách */}
        {loading ? (
          <div className="py-24 text-center text-brand-text bg-white rounded-2xl border border-brand-divider/60 shadow-xs">
            <div className="w-8 h-8 mx-auto border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium">Đang tải danh sách đơn hàng...</p>
          </div>
        ) : rawOrders.length === 0 ? (
          <div className="py-16 text-center text-brand-text bg-white rounded-2xl border border-brand-divider/60 p-8 shadow-xs">
            {!isOnline ? (
              <>
                <p className="font-bold text-ink text-base">Chưa có dữ liệu ngoại tuyến</p>
                <p className="text-sm mt-1">
                  Kết nối mạng một lần để tải đơn hàng về máy, sau đó vẫn tra cứu được khi mất sóng.
                </p>
              </>
            ) : (
              <div>
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-neutral-100 flex items-center justify-center text-stone-400">
                  <Icon name="receipt" size={32} />
                </div>
                <h4 className="font-bold text-ink text-base">Bạn chưa có đơn hàng nào</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                  Hãy ghé thăm trang chủ và đặt mua các mặt hàng vật liệu xây dựng chất lượng nhất.
                </p>
                <Link
                  viewTransition
                  to={PATHS.home}
                  className="mt-4 inline-flex items-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold font-display rounded-xl text-sm shadow-xs transition"
                >
                  <Icon name="store" size={16} />
                  <span>Mua hàng ngay</span>
                </Link>
              </div>
            )}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-12 text-center text-brand-text bg-white rounded-2xl border border-brand-divider/60 p-6 shadow-xs">
            <p className="font-semibold text-ink text-sm">Không tìm thấy đơn hàng phù hợp</p>
            <p className="text-xs text-stone-500 mt-1">Vui lòng thử lại với từ khóa tìm kiếm hoặc bộ lọc khác.</p>
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ALL')
                setSearchTerm('')
                setPage(1)
              }}
              className="mt-3 text-xs font-bold text-primary hover:underline cursor-pointer"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          /* BẢNG DANH SÁCH ĐƠN HÀNG (TABLE LAYOUT) */
          <div className="bg-white rounded-2xl border border-brand-divider/70 shadow-xs overflow-hidden flex flex-col">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-neutral-50/90 border-b border-brand-divider/70 text-[11px] font-bold text-brand-text uppercase tracking-wider">
                    <th className="py-3 px-4 whitespace-nowrap">Mã đơn</th>
                    <th className="py-3 px-4 whitespace-nowrap">Ngày đặt</th>
                    <th className="py-3 px-4 whitespace-nowrap">Người nhận</th>
                    <th className="py-3 px-4 min-w-[200px]">Sản phẩm</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Tổng tiền</th>
                    <th className="py-3 px-4 text-center whitespace-nowrap">Trạng thái</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Thao tác</th>
                  </tr>
                </thead>
                <tbody ref={tableBodyRef} className="divide-y divide-brand-divider/40">
                  {pagedOrders.map((o) => {
                    const statusCfg = STATUS_CONFIG[o.status] || {
                      label: o.status,
                      badgeClass: 'bg-neutral-100 text-neutral-800 border border-neutral-300/60',
                    }
                    const itemsCount = o.items?.length || 0
                    const firstItem = o.items?.[0]

                    return (
                      <tr key={o.id} data-order-row className="hover:bg-neutral-50/70 transition-colors">
                        {/* Mã đơn */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setDetailOrder(o)}
                            className="font-black font-mono text-primary hover:underline cursor-pointer text-xs sm:text-sm"
                            title="Bấm để xem chi tiết đơn hàng"
                          >
                            #{o.id}
                          </button>
                        </td>

                        {/* Ngày đặt */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-stone-600 text-xs">
                          <div>{new Date(o.createdAt).toLocaleDateString('vi-VN')}</div>
                          <div className="text-[10px] text-stone-400">
                            {new Date(o.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        {/* Người nhận */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <strong className="text-ink block text-xs sm:text-sm">{o.recipientName}</strong>
                          <span className="text-[11px] text-stone-500 font-mono block">{o.phoneNumber}</span>
                          {o.address && (
                            <span className="text-[11px] text-stone-400 truncate max-w-[160px] block" title={o.address}>
                              {o.address}
                            </span>
                          )}
                        </td>

                        {/* Sản phẩm */}
                        <td className="py-3.5 px-4">
                          {firstItem ? (
                            <div>
                              <span className="text-ink font-medium leading-snug">
                                {firstItem.productName}{' '}
                                <span className="text-stone-400 text-xs">×{firstItem.quantity}</span>
                              </span>
                              {itemsCount > 1 && (
                                <span className="ml-1 text-[11px] text-primary font-semibold">
                                  (+{itemsCount - 1} món khác)
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-400 italic">Không có sản phẩm</span>
                          )}
                        </td>

                        {/* Tổng tiền */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <strong className="font-extrabold font-display text-sm sm:text-base text-primary">
                            {o.total?.toLocaleString('vi-VN')}đ
                          </strong>
                        </td>

                        {/* Trạng thái */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${statusCfg.badgeClass}`}
                          >
                            {statusCfg.label}
                          </span>
                        </td>

                        {/* Thao tác */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Nút Xem chi tiết */}
                            <button
                              type="button"
                              onClick={() => setDetailOrder(o)}
                              className="px-2.5 py-1.5 rounded-lg border border-brand-divider text-stone-700 hover:text-ink hover:bg-neutral-100 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                              title="Xem chi tiết đơn hàng"
                            >
                              <Icon name="eye" size={13} />
                              <span className="hidden sm:inline">Chi tiết</span>
                            </button>

                            {/* Nút Đặt lại đơn */}
                            <button
                              type="button"
                              onClick={() => handleReorder(o.id)}
                              disabled={reorderingId === o.id}
                              className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-bold font-display shadow-2xs transition inline-flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Đặt lại đơn hàng này"
                            >
                              {reorderingId === o.id ? (
                                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Icon name="refresh" size={13} />
                              )}
                              <span className="hidden md:inline">Đặt lại</span>
                            </button>

                            {/* Nút Huỷ đơn nếu Chờ xác nhận */}
                            {o.status === 'Pending' && (
                              <button
                                type="button"
                                onClick={() => setConfirmCancelOrder(o)}
                                disabled={cancellingId === o.id}
                                className="px-2 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                                title="Huỷ đơn hàng"
                              >
                                {cancellingId === o.id ? '...' : 'Huỷ'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Phân trang */}
            <Pagination
              page={page}
              totalPages={totalPages}
              total={filteredOrders.length}
              pageSize={pageSize}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize)
                setPage(1)
              }}
              onPage={setPage}
              label="đơn hàng"
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        )}
      </main>

      {/* Modal xem chi tiết đơn hàng */}
      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          onClose={() => setDetailOrder(null)}
          onCancel={(o) => {
            setDetailOrder(null)
            setConfirmCancelOrder(o)
          }}
          onReorder={(id) => handleReorder(id)}
          cancellingId={cancellingId}
          reorderingId={reorderingId}
        />
      )}

      {/* Modal xác nhận huỷ đơn */}
      {confirmCancelOrder && (
        <ConfirmModal
          icon={<Icon name="alert" size={30} />}
          title="Huỷ đơn hàng?"
          message={`Đơn #${confirmCancelOrder.id} trị giá ${confirmCancelOrder.total?.toLocaleString('vi-VN')}đ sẽ được huỷ.`}
          warning="Bạn vẫn có thể đặt lại đơn hàng này sau nếu muốn."
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
