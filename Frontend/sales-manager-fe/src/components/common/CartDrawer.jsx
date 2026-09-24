import { useState } from 'react'
import toast from 'react-hot-toast'
import { useCart } from '../../context/cart-context'
import { orderService } from '../../services/orderService'
import { useRequireOnline } from '../../hooks/useRequireOnline'
import { useModalA11y } from '../../hooks/useModalA11y'
import { resolveMediaUrl } from '../../services/config'
import { Icon } from './Icon'
import OptimizedImage from './OptimizedImage'

/**
 * Ngăn kéo hiển thị giỏ hàng xem nhanh và thanh toán
 */
function CartDrawer({ open, onClose, user, isLoggedIn, onLoginClick, onOrdered }) {
  const { items, updateQuantity, removeItem, clear, totalPrice } = useCart()
  const requireOnline = useRequireOnline()
  const [form, setForm] = useState({
    recipientName: '',
    phoneNumber: '',
    address: '',
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const dialogRef = useModalA11y({ onClose, enabled: open })

  const [prevOpen, setPrevOpen] = useState(open)
  if (open !== prevOpen) {
    setPrevOpen(open)
    if (open) {
      setForm((prev) => ({
        ...prev,
        recipientName: prev.recipientName || user?.fullName || user?.username || '',
        phoneNumber: prev.phoneNumber || user?.phoneNumber || '',
      }))
    }
  }

  if (!open) return null

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (items.length === 0) { toast.error('Giỏ hàng trống.'); return }
    if (!form.recipientName.trim()) { toast.error('Vui lòng nhập tên người nhận.'); return }
    if (!form.phoneNumber.trim()) { toast.error('Vui lòng nhập số điện thoại.'); return }
    if (!requireOnline('Đặt hàng')) return

    setSubmitting(true)
    try {
      await orderService.create({
        recipientName: form.recipientName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim() || null,
        note: form.note.trim() || null,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
      })
      toast.success('Đặt hàng thành công! Chúng tôi sẽ liên hệ xác nhận sớm.')
      clear()
      onOrdered?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Đặt hàng thất bại.')
    }
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs transition-opacity" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-brand-divider/60 bg-neutral-50/70">
          <h3 id="cart-drawer-title" className="text-lg font-bold font-display text-ink flex items-center gap-2">
            <Icon name="cart" size={20} />
            <span>Giỏ hàng</span>
          </h3>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-brand-text hover:text-ink hover:bg-neutral-200 transition cursor-pointer text-sm"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-brand-text">
            <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center text-brand-text mb-3">
              <Icon name="cart" size={28} />
            </div>
            <p className="text-sm">Giỏ hàng của bạn đang trống.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto divide-y divide-brand-divider/40 px-5 py-2">
              {items.map(i => (
                <div className="py-3.5 flex items-center gap-3 relative" key={i.productId}>
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden border border-brand-divider/40">
                    {i.imageUrl ? (
                      <OptimizedImage
                        src={resolveMediaUrl(i.imageUrl)}
                        alt={i.productName}
                        fallbackIcon="box"
                        className="w-full h-full object-cover"
                        wrapperClassName="w-full h-full"
                      />
                    ) : (
                      <Icon name="box" size={24} className="text-brand-text" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <strong className="block text-sm text-ink truncate">{i.productName}</strong>
                    <span className="text-xs text-primary font-bold">
                      {i.price?.toLocaleString('vi-VN')}đ <span className="text-brand-text font-normal">/ {i.unit}</span>
                    </span>
                    <div className="flex items-center gap-1.5 mt-2">
                      <div className="inline-flex items-center border border-brand-divider rounded-lg overflow-hidden bg-white">
                        <button
                          type="button"
                          className="w-7 h-7 flex items-center justify-center text-ink hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          onClick={() => updateQuantity(i.productId, i.quantity - 1)}
                          disabled={i.quantity <= 1}
                        >
                          −
                        </button>
                        <input
                          type="number"
                          className="w-10 h-7 text-center text-xs font-bold text-ink border-x border-brand-divider focus:outline-none"
                          value={i.quantity}
                          min={1}
                          max={i.maxStock}
                          onChange={e => {
                            const val = e.target.valueAsNumber
                            if (!Number.isNaN(val)) updateQuantity(i.productId, Math.trunc(val))
                          }}
                        />
                        <button
                          type="button"
                          className="w-7 h-7 flex items-center justify-center text-ink hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                          onClick={() => updateQuantity(i.productId, i.quantity + 1)}
                          disabled={i.quantity >= i.maxStock}
                        >
                          +
                        </button>
                      </div>
                      {i.quantity >= i.maxStock && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded font-medium">
                          Tối đa {i.maxStock}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="absolute right-0 top-3.5 text-neutral-400 hover:text-red-600 p-1 transition cursor-pointer"
                    onClick={() => removeItem(i.productId)}
                    title="Xóa"
                    aria-label="Xoá khỏi giỏ"
                  >
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between px-5 py-3.5 border-t border-brand-divider/60 bg-neutral-50/70">
              <span className="text-sm font-semibold text-brand-text">Tổng cộng</span>
              <strong className="text-lg font-bold font-display text-primary">
                {totalPrice.toLocaleString('vi-VN')}đ
              </strong>
            </div>

            {!isLoggedIn ? (
              <div className="p-5 border-t border-brand-divider/60 bg-white text-center space-y-3">
                <p className="text-xs text-brand-text">Vui lòng đăng nhập để hoàn tất đơn hàng.</p>
                <button
                  className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white font-extrabold font-display text-sm tracking-wide rounded-xl shadow transition cursor-pointer"
                  onClick={() => { onClose(); onLoginClick?.() }}
                >
                  Đăng nhập
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="p-5 border-t border-brand-divider/60 space-y-3 bg-white overflow-y-auto max-h-72">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1">
                    Tên người nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.recipientName}
                    onChange={set('recipientName')}
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full px-3 py-2 rounded-xl border border-brand-divider text-xs text-ink bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={form.phoneNumber}
                    onChange={set('phoneNumber')}
                    required
                    placeholder="0987654321"
                    className="w-full px-3 py-2 rounded-xl border border-brand-divider text-xs text-ink bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1">
                    Địa chỉ giao hàng
                  </label>
                  <input
                    value={form.address}
                    onChange={set('address')}
                    placeholder="Số nhà, đường, phường/xã..."
                    className="w-full px-3 py-2 rounded-xl border border-brand-divider text-xs text-ink bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-brand-text mb-1">
                    Ghi chú
                  </label>
                  <input
                    value={form.note}
                    onChange={set('note')}
                    placeholder="Thời gian giao hàng mong muốn..."
                    className="w-full px-3 py-2 rounded-xl border border-brand-divider text-xs text-ink bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 py-3 px-4 bg-primary hover:bg-primary-dark text-white font-extrabold font-display text-base tracking-wide rounded-xl shadow transition transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? 'Đang đặt hàng...' : 'Đặt hàng ngay'}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default CartDrawer
