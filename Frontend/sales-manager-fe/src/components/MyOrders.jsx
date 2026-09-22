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

const STATUS_CONFIG = {
  Pending: { label: 'Chờ xác nhận', badgeClass: 'bg-amber-100 text-amber-900' },
  Confirmed: { label: 'Đã xác nhận', badgeClass: 'bg-emerald-100 text-emerald-800' },
  Cancelled: { label: 'Đã huỷ', badgeClass: 'bg-red-100 text-red-700' },
}

/**
 * Màn hình quản lý lịch sử đơn đặt hàng của khách hàng (xem trạng thái, hủy đơn, đặt lại đơn)
 */
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

  const orders = [...(data ?? [])].sort((a, b) => new Date(b.confirmedAt || b.createdAt || 0) - new Date(a.confirmedAt || a.createdAt || 0) || (b.id || 0) - (a.id || 0))

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
    <div className="min-h-screen flex flex-col bg-brand-bg text-ink">
      <PageMeta title="Đơn hàng của tôi" noIndex />
      <header className="sticky top-0 z-40 bg-brand-bg/95 backdrop-blur-md border-b border-brand-divider/60">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 select-none">
            <div className="shrink-0"><LogoBadge size={40} variant="reversed" /></div>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full flex-1">
        {isStale && !loading && (
          <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium" role="status">
            {isOnline
              ? `Chưa cập nhật được — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`
              : `Đang ngoại tuyến — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-brand-text">
            <div className="w-8 h-8 mx-auto border-3 border-primary border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm">Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-16 text-center text-brand-text bg-white rounded-2xl border border-brand-divider/60 p-8 shadow-xs">
            {!isOnline ? (
              <>
                <p className="font-bold text-ink text-base">Chưa có dữ liệu ngoại tuyến</p>
                <p className="text-sm mt-1">Kết nối mạng một lần để tải đơn hàng về máy, sau đó vẫn tra cứu được khi mất sóng.</p>
              </>
            ) : (
              <div>
                <p className="text-sm">Bạn chưa có đơn hàng nào.</p>
                <Link
                  viewTransition
                  to={PATHS.home}
                  className="mt-4 inline-block px-5 py-2.5 bg-primary hover:bg-primary-dark text-white font-bold font-display rounded-xl text-sm shadow-xs transition"
                >
                  Mua hàng ngay
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => {
              const statusCfg = STATUS_CONFIG[o.status] || { label: o.status, badgeClass: 'bg-neutral-100 text-neutral-800' }
              return (
                <div className="bg-white rounded-2xl border border-brand-divider/60 shadow-xs p-5 sm:p-6" key={o.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-brand-divider/30 text-xs sm:text-sm">
                    <span className="font-bold text-ink">
                      Đơn #{o.id} · <span className="text-brand-text font-normal">{new Date(o.createdAt).toLocaleDateString('vi-VN')}</span>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-md font-bold text-xs ${statusCfg.badgeClass}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="py-3 text-xs sm:text-sm text-brand-text leading-relaxed">
                    <span className="text-xs uppercase font-bold text-brand-text/70 block mb-0.5">Giao tới</span>
                    <strong className="text-ink font-semibold">{o.recipientName}</strong> · {o.phoneNumber}
                    {o.address && <div className="text-xs text-brand-text mt-0.5">{o.address}</div>}
                  </div>

                  <div className="py-2 border-y border-brand-divider/30 divide-y divide-brand-divider/20 text-xs sm:text-sm">
                    {o.items.map((it, idx) => (
                      <div key={idx} className="py-1.5 flex justify-between items-center">
                        <span className="text-ink font-medium">
                          {it.productName} <span className="text-brand-text font-normal">× {it.quantity}</span>
                        </span>
                        <span className="font-bold text-ink">
                          {(it.quantity * it.unitPrice).toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-3 font-bold text-sm sm:text-base">
                    <span className="text-brand-text text-sm">Tổng cộng</span>
                    <strong className="text-primary font-display text-lg">
                      {o.total.toLocaleString('vi-VN')}đ
                    </strong>
                  </div>

                  {o.status === 'Cancelled' && o.cancelReason && (
                    <p className="mt-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-100">
                      Lý do huỷ: {o.cancelReason}
                    </p>
                  )}

                  {o.status === 'Pending' && (
                    <div className="mt-4 pt-3 border-t border-brand-divider/30 flex justify-end">
                      <button
                        className="px-4 py-1.5 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold transition cursor-pointer disabled:opacity-50"
                        onClick={() => setConfirmCancelOrder(o)}
                        disabled={cancellingId === o.id}
                      >
                        {cancellingId === o.id ? 'Đang huỷ...' : 'Huỷ đơn hàng'}
                      </button>
                    </div>
                  )}

                  {o.status === 'Cancelled' && (
                    <div className="mt-4 pt-3 border-t border-brand-divider/30 flex justify-end">
                      <button
                        className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-xs font-bold font-display shadow-xs transition inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        onClick={() => handleReorder(o.id)}
                        disabled={reorderingId === o.id}
                      >
                        {reorderingId === o.id ? 'Đang xử lý...' : <><Icon name="refresh" size={14} /> Đặt lại đơn</>}
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

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
