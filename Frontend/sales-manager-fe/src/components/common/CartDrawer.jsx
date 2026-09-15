import { useState } from 'react'
import toast from 'react-hot-toast'
import { useCart } from '../../context/cart-context'
import { orderService } from '../../services/orderService'
import { useRequireOnline } from '../../hooks/useRequireOnline'
import { useModalA11y } from '../../hooks/useModalA11y'
import { resolveMediaUrl } from '../../services/config'
import { Icon } from './Icon'

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
    <div className="modal-overlay">
      <div
        className="cart-drawer"
        onClick={e => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <div className="modal-header">
          <h3 id="cart-drawer-title"><Icon name="cart" size={20} /> Giỏ hàng</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        {items.length === 0 ? (
          <p className="cart-empty">Giỏ hàng của bạn đang trống.</p>
        ) : (
          <>
            <div className="cart-items">
              {items.map(i => (
                <div className="cart-item" key={i.productId}>
                  <div className="cart-item-thumb">
                    {i.imageUrl ? <img src={resolveMediaUrl(i.imageUrl)} alt={i.productName} loading="lazy" decoding="async" /> : <Icon name="box" size={26} />}
                  </div>
                  <div className="cart-item-info">
                    <strong>{i.productName}</strong>
                    <span className="cart-item-price">{i.price?.toLocaleString('vi-VN')}đ / {i.unit}</span>
                    <div className="cart-item-qty">
                      <button type="button" onClick={() => updateQuantity(i.productId, i.quantity - 1)} disabled={i.quantity <= 1}>−</button>
                      <input
                        type="number"
                        className="cart-item-qty-input"
                        value={i.quantity}
                        min={1}
                        max={i.maxStock}
                        onChange={e => {
                          const val = e.target.valueAsNumber
                          if (!Number.isNaN(val)) updateQuantity(i.productId, Math.trunc(val))
                        }}
                      />
                      <button type="button" onClick={() => updateQuantity(i.productId, i.quantity + 1)} disabled={i.quantity >= i.maxStock}>+</button>
                    </div>
                    {i.quantity >= i.maxStock && <span className="cart-item-max-note">Tối đa {i.maxStock}</span>}
                  </div>
                  <button type="button" className="cart-item-remove" onClick={() => removeItem(i.productId)} title="Xóa" aria-label="Xoá khỏi giỏ"><Icon name="trash" size={17} /></button>
                </div>
              ))}
            </div>

            <div className="cart-total-row">
              <span>Tổng cộng</span>
              <strong>{totalPrice.toLocaleString('vi-VN')}đ</strong>
            </div>

            {!isLoggedIn ? (
              <div className="cart-login-prompt">
                <p>Vui lòng đăng nhập để đặt hàng.</p>
                <button className="btn-primary" style={{ width: '100%' }} onClick={() => { onClose(); onLoginClick?.() }}>
                  Đăng nhập
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckout} className="cart-checkout-form">
                <label className="form-field">
                  <span>Tên người nhận <span className="required">*</span></span>
                  <input value={form.recipientName} onChange={set('recipientName')} required />
                </label>
                <label className="form-field">
                  <span>Số điện thoại <span className="required">*</span></span>
                  <input value={form.phoneNumber} onChange={set('phoneNumber')} required />
                </label>
                <label className="form-field">
                  <span>Địa chỉ giao hàng</span>
                  <input value={form.address} onChange={set('address')} placeholder="Số nhà, đường, phường/xã..." />
                </label>
                <label className="form-field">
                  <span>Ghi chú</span>
                  <input value={form.note} onChange={set('note')} placeholder="Thời gian giao hàng mong muốn..." />
                </label>

                <button className="btn-primary" type="submit" disabled={submitting} style={{ width: '100%' }}>
                  {submitting ? 'Đang đặt hàng...' : 'Đặt hàng'}
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
