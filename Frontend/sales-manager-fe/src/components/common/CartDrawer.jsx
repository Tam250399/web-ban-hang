import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { LuArrowLeft, LuShieldCheck, LuShoppingBag } from 'react-icons/lu'
import { useCart } from '../../context/cart-context'
import { orderService } from '../../services/orderService'
import { useRequireOnline } from '../../hooks/useRequireOnline'
import { useModalA11y } from '../../hooks/useModalA11y'
import { resolveMediaUrl } from '../../services/config'
import { Icon } from './Icon'
import OptimizedImage from './OptimizedImage'

/**
 * Ngăn kéo giỏ hàng hiện đại (2 bước: Xem giỏ hàng -> Đặt hàng),
 * loại bỏ hoàn toàn lỗi tràn layout, nút bấm luôn cố định ở đáy (Sticky CTA).
 */
function CartDrawer({ open, onClose, user, isLoggedIn, onLoginClick, onOrdered }) {
  const { items, updateQuantity, removeItem, clear, totalPrice, totalCount } = useCart()
  const requireOnline = useRequireOnline()
  const [step, setStep] = useState('cart') // 'cart' | 'checkout'
  const [showClearConfirm, setShowClearConfirm] = useState(false)
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
      setStep('cart')
      setShowClearConfirm(false)
      setForm((prev) => ({
        ...prev,
        recipientName: prev.recipientName || user?.fullName || user?.username || '',
        phoneNumber: prev.phoneNumber || user?.phoneNumber || '',
      }))
    }
  }

  // Tự động quay về bước giỏ hàng nếu hết sản phẩm
  useEffect(() => {
    if (items.length === 0 && step === 'checkout') {
      setStep('cart')
    }
  }, [items.length, step])

  if (!open) return null

  const setField = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleClearCart = () => {
    clear()
    setShowClearConfirm(false)
    toast.success('Đã xóa toàn bộ giỏ hàng')
  }

  const handleCheckout = async (e) => {
    e.preventDefault()
    if (items.length === 0) {
      toast.error('Giỏ hàng trống.')
      return
    }
    if (!form.recipientName.trim()) {
      toast.error('Vui lòng nhập họ tên người nhận.')
      return
    }
    if (!form.phoneNumber.trim()) {
      toast.error('Vui lòng nhập số điện thoại liên hệ.')
      return
    }
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
      toast.success('Đặt hàng thành công! Chúng tôi sẽ sớm liên hệ xác nhận.')
      clear()
      onOrdered?.()
      onClose()
    } catch (err) {
      toast.error(err.message || 'Đặt hàng thất bại. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md h-full bg-neutral-50 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={e => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-brand-divider/70 shadow-2xs z-10 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {step === 'checkout' ? (
              <button
                type="button"
                className="w-8 h-8 -ml-1 rounded-xl flex items-center justify-center text-ink hover:bg-neutral-100 transition cursor-pointer"
                onClick={() => setStep('cart')}
                title="Quay lại giỏ hàng"
              >
                <LuArrowLeft size={18} />
              </button>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <LuShoppingBag size={18} />
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <h3 id="cart-drawer-title" className="text-lg font-black font-display text-ink tracking-tight">
                {step === 'checkout' ? 'Thông tin giao hàng' : 'Giỏ hàng'}
              </h3>
              {step === 'cart' && items.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold font-mono rounded-full bg-primary/10 text-primary border border-primary/20">
                  {totalCount} món
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {step === 'cart' && items.length > 0 && (
              showClearConfirm ? (
                <div className="flex items-center gap-1 bg-red-50 p-1 rounded-xl border border-red-200 animate-in fade-in">
                  <button
                    type="button"
                    onClick={handleClearCart}
                    className="text-[11px] font-bold text-red-700 hover:bg-red-600 hover:text-white px-2 py-1 rounded-lg transition cursor-pointer"
                  >
                    Xóa hết
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="text-[11px] text-stone-500 hover:bg-stone-200 px-1.5 py-1 rounded-lg transition cursor-pointer"
                  >
                    Hủy
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-xs text-stone-500 hover:text-red-600 hover:bg-red-50/80 px-2 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer font-medium"
                  title="Xóa toàn bộ giỏ hàng"
                >
                  <Icon name="trash" size={13} />
                  <span>Xóa tất cả</span>
                </button>
              )
            )}
            <button
              className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-ink hover:bg-neutral-100 transition cursor-pointer text-sm font-bold"
              onClick={onClose}
              aria-label="Đóng"
            >
              ✕
            </button>
          </div>
        </div>

        {/* ================= BODY ================= */}
        {items.length === 0 ? (
          /* TRẠNG THÁI GIỎ HÀNG TRỐNG */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
            <div className="w-24 h-24 rounded-3xl bg-neutral-100 border border-brand-divider/60 flex items-center justify-center text-stone-400 mb-4 shadow-inner">
              <Icon name="cart" size={44} />
            </div>
            <h4 className="text-lg font-bold font-display text-ink mb-1">Giỏ hàng của bạn đang trống</h4>
            <p className="text-xs text-stone-500 max-w-xs mb-6 leading-relaxed">
              Bạn chưa thêm sản phẩm vật liệu xây dựng nào. Hãy chọn ngay các sản phẩm chất lượng với giá tốt nhất!
            </p>
            <button
              type="button"
              className="px-6 py-3 bg-primary hover:bg-primary-dark text-white font-bold font-display text-sm tracking-wide rounded-xl shadow-md shadow-primary/20 transition active:scale-95 cursor-pointer flex items-center gap-2"
              onClick={onClose}
            >
              <Icon name="store" size={16} />
              <span>Khám phá sản phẩm ngay</span>
            </button>
          </div>
        ) : step === 'cart' ? (
          /* BƯỚC 1: XEM & CHỈNH SỬA SẢN PHẨM TRONG GIỎ */
          <div className="flex-1 flex flex-col min-h-0 bg-neutral-50/50">
            {/* Danh sách thẻ sản phẩm */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {items.map((i) => {
                const itemTotal = (i.price ?? 0) * i.quantity
                return (
                  <div
                    key={i.productId}
                    className="p-3 bg-white rounded-2xl border border-brand-divider/60 shadow-2xs hover:border-primary/40 transition-all flex items-center gap-3 relative group"
                  >
                    {/* Ảnh sản phẩm */}
                    <div className="w-16 h-16 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0 overflow-hidden border border-brand-divider/40">
                      {i.imageUrl ? (
                        <OptimizedImage
                          src={resolveMediaUrl(i.imageUrl)}
                          alt={i.productName}
                          fallbackIcon="box"
                          className="w-full h-full object-cover"
                          wrapperClassName="w-full h-full"
                        />
                      ) : (
                        <Icon name="box" size={24} className="text-stone-400" />
                      )}
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="flex-1 min-w-0 pr-6">
                      <h5 className="text-xs sm:text-sm font-bold text-ink truncate leading-tight" title={i.productName}>
                        {i.productName}
                      </h5>

                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="text-xs font-black font-display text-primary">
                          {i.price?.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-[11px] text-stone-500">/ {i.unit}</span>
                      </div>

                      {/* Bộ tăng giảm số lượng & Thành tiền */}
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-dashed border-brand-divider/40">
                        {/* Stepper pill */}
                        <div className="inline-flex items-center bg-neutral-100/90 rounded-xl p-0.5 border border-brand-divider/50 shadow-2xs">
                          <button
                            type="button"
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-ink hover:bg-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-xs active:scale-95"
                            onClick={() => updateQuantity(i.productId, i.quantity - 1)}
                            disabled={i.quantity <= 1}
                            title="Giảm 1"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            className="w-9 h-6 text-center text-xs font-bold font-mono text-ink bg-transparent border-0 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            value={i.quantity}
                            min={1}
                            max={i.maxStock}
                            onChange={(e) => {
                              const val = e.target.valueAsNumber
                              if (!Number.isNaN(val) && val >= 1) {
                                updateQuantity(i.productId, Math.trunc(val))
                              }
                            }}
                          />
                          <button
                            type="button"
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-ink hover:bg-white text-xs font-bold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-xs active:scale-95"
                            onClick={() => updateQuantity(i.productId, i.quantity + 1)}
                            disabled={i.quantity >= i.maxStock}
                            title="Tăng 1"
                          >
                            +
                          </button>
                        </div>

                        {/* Tổng tiền của dòng sản phẩm */}
                        <div className="text-right">
                          <span className="text-xs font-extrabold font-display text-ink">
                            {itemTotal.toLocaleString('vi-VN')}đ
                          </span>
                        </div>
                      </div>

                      {/* Cảnh báo số lượng tồn kho */}
                      {i.quantity >= i.maxStock && (
                        <p className="text-[10px] text-amber-700 mt-1 font-medium flex items-center gap-1">
                          <Icon name="alert" size={11} />
                          <span>Đã đạt số lượng tồn kho tối đa ({i.maxStock} {i.unit})</span>
                        </p>
                      )}
                    </div>

                    {/* Nút xóa món */}
                    <button
                      type="button"
                      className="absolute right-2 top-2 w-7 h-7 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                      onClick={() => removeItem(i.productId)}
                      title="Xóa sản phẩm này"
                      aria-label="Xoá khỏi giỏ"
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* STICKY FOOTER TỔNG KẾT & TIẾN HÀNH ĐẶT HÀNG */}
            <div className="p-4 bg-white border-t border-brand-divider/70 shadow-lg space-y-3 shrink-0">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-stone-500">
                  <span>Tạm tính ({totalCount} sản phẩm):</span>
                  <span className="font-semibold text-ink font-mono">{totalPrice.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-stone-500">
                  <span>Phí vận chuyển:</span>
                  <span className="font-semibold text-emerald-600">Miễn phí / Báo khi giao</span>
                </div>
                <div className="flex items-baseline justify-between pt-2 border-t border-brand-divider/40">
                  <span className="text-sm font-extrabold text-ink uppercase tracking-tight">Tổng thanh toán</span>
                  <span className="text-2xl font-black font-display text-primary">
                    {totalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {!isLoggedIn ? (
                <div className="pt-1">
                  <button
                    type="button"
                    className="w-full py-3.5 px-4 bg-primary hover:bg-primary-dark text-white font-extrabold font-display text-base tracking-wide rounded-xl shadow-md shadow-primary/20 transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                    onClick={() => {
                      onClose()
                      onLoginClick?.()
                    }}
                  >
                    <Icon name="user" size={18} />
                    <span>Đăng nhập để đặt hàng</span>
                  </button>
                  <p className="text-[11px] text-center text-stone-500 mt-2">
                    Vui lòng đăng nhập để lưu trữ lịch sử đơn hàng và theo dõi vận chuyển.
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  className="w-full py-3.5 px-5 bg-primary hover:bg-primary-dark text-white font-extrabold font-display text-base tracking-wide rounded-xl shadow-lg shadow-primary/25 transition active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2 group"
                  onClick={() => setStep('checkout')}
                >
                  <span>Tiến hành đặt hàng</span>
                  <span className="text-white/80 group-hover:translate-x-1 transition-transform">→</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* BƯỚC 2: NHẬP THÔNG TIN VẬN CHUYỂN & XÁC NHẬN ĐƠN */
          <form onSubmit={handleCheckout} className="flex-1 flex flex-col min-h-0 bg-neutral-50/50">
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Tóm tắt đơn hàng thu gọn */}
              <div className="p-3.5 bg-white rounded-2xl border border-brand-divider/60 shadow-2xs">
                <div className="flex items-center justify-between pb-2 border-b border-brand-divider/40">
                  <span className="text-xs font-bold text-stone-600 flex items-center gap-1.5">
                    <Icon name="clipboard" size={14} className="text-primary" />
                    <span>Đơn hàng ({totalCount} sản phẩm)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep('cart')}
                    className="text-xs font-bold text-primary hover:underline cursor-pointer"
                  >
                    Xem lại
                  </button>
                </div>
                <div className="flex items-baseline justify-between pt-2">
                  <span className="text-xs text-stone-500">Tổng thanh toán dự kiến:</span>
                  <span className="text-lg font-black font-display text-primary">
                    {totalPrice.toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              {/* Nhóm thông tin người nhận */}
              <div className="p-4 bg-white rounded-2xl border border-brand-divider/60 shadow-2xs space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Icon name="user" size={14} className="text-primary" />
                  <span>Thông tin người nhận</span>
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Họ và tên người nhận <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      value={form.recipientName}
                      onChange={setField('recipientName')}
                      required
                      placeholder="Ví dụ: Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-divider text-xs sm:text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Số điện thoại nhận hàng <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      value={form.phoneNumber}
                      onChange={setField('phoneNumber')}
                      required
                      placeholder="Ví dụ: 0987654321"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-brand-divider text-xs sm:text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Nhóm địa chỉ giao hàng & Ghi chú */}
              <div className="p-4 bg-white rounded-2xl border border-brand-divider/60 shadow-2xs space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5">
                  <Icon name="pin" size={14} className="text-primary" />
                  <span>Địa điểm & Ghi chú</span>
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Địa chỉ giao hàng (Công trình / Nhà riêng)
                  </label>
                  <input
                    value={form.address}
                    onChange={setField('address')}
                    placeholder="Số nhà, đường phố, phường/xã, quận/huyện..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-brand-divider text-xs sm:text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Ghi chú đơn hàng (Thời gian giao, yêu cầu bốc dỡ...)
                  </label>
                  <textarea
                    rows={2}
                    value={form.note}
                    onChange={setField('note')}
                    placeholder="Giao trước 11h trưa, đường vào xe tải 5 tấn được..."
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-divider text-xs sm:text-sm text-ink bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition resize-none"
                  />
                </div>
              </div>

              {/* Chính sách bảo đảm */}
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/50 flex items-start gap-2.5 text-xs text-emerald-900">
                <LuShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <span className="font-bold">Thanh toán an toàn khi nhận hàng:</span> Bạn có thể kiểm tra đủ số lượng và chất lượng vật liệu trước khi thanh toán tiền mặt hoặc chuyển khoản.
                </div>
              </div>
            </div>

            {/* STICKY FOOTER XÁC NHẬN ĐẶT HÀNG - KHÔNG BAO GIỜ BỊ KHUẤT */}
            <div className="p-4 bg-white border-t border-brand-divider/70 shadow-lg space-y-2 shrink-0">
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-4 bg-primary hover:bg-primary-dark text-white font-extrabold font-display text-base tracking-wide rounded-xl shadow-lg shadow-primary/25 transition transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Đang gửi đơn hàng...</span>
                  </>
                ) : (
                  <>
                    <Icon name="check" size={18} />
                    <span>Xác nhận đặt hàng</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep('cart')}
                disabled={submitting}
                className="w-full py-2 text-xs font-bold text-stone-500 hover:text-ink transition cursor-pointer"
              >
                ← Quay lại danh sách sản phẩm
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

export default CartDrawer
