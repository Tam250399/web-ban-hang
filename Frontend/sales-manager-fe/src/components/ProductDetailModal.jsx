import { useCallback, useLayoutEffect, useRef } from 'react'
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from './categoryIcons'
import { resolveMediaUrl } from '../services/config'
import { useModalA11y } from '../hooks/useModalA11y'
import { Icon } from './common/Icon'

/**
 * Hộp thoại hiển thị chi tiết thông tin và hình ảnh sản phẩm với hiệu ứng Container Transform (Card to Modal)
 */
function ProductDetailModal({ product, onClose, onAddToCart, hideAddToCart }) {
  const backdropRef = useRef(null)
  const detailsRef = useRef(null)
  const isClosingRef = useRef(false)

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return
    isClosingRef.current = true

    const modalEl = dialogRef.current
    const backdropEl = backdropRef.current
    const detailsEl = detailsRef.current

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || !modalEl) {
      onClose()
      return
    }

    const cardEl = document.querySelector(`[data-product-card-id="${product.id}"]`)
    const cardRect = cardEl?.getBoundingClientRect() || (window.__lastProductCardRect?.id === product.id ? window.__lastProductCardRect.rect : null)
    const modalRect = modalEl.getBoundingClientRect()

    if (cardRect && modalRect.width > 0 && modalRect.height > 0) {
      const deltaX = (cardRect.left + cardRect.width / 2) - (modalRect.left + modalRect.width / 2)
      const deltaY = (cardRect.top + cardRect.height / 2) - (modalRect.top + modalRect.height / 2)
      const scaleX = Math.max(0.08, cardRect.width / modalRect.width)
      const scaleY = Math.max(0.08, cardRect.height / modalRect.height)

      modalEl.style.transition = 'transform 290ms cubic-bezier(0.2, 0, 0, 1), opacity 230ms ease, border-radius 290ms ease'
      modalEl.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`
      modalEl.style.borderRadius = '1rem'
      modalEl.style.opacity = '0'
      if (detailsEl) {
        detailsEl.style.transition = 'opacity 140ms ease'
        detailsEl.style.opacity = '0'
      }
    } else {
      modalEl.style.transition = 'transform 230ms ease-in, opacity 200ms ease-in'
      modalEl.style.transform = 'scale(0.92)'
      modalEl.style.opacity = '0'
    }

    if (backdropEl) {
      backdropEl.style.transition = 'opacity 260ms ease-in'
      backdropEl.style.opacity = '0'
    }

    setTimeout(() => {
      onClose()
    }, 290)
  }, [product.id, onClose])

  const dialogRef = useModalA11y({ onClose: handleClose })

  useLayoutEffect(() => {
    const modalEl = dialogRef.current
    const backdropEl = backdropRef.current
    const detailsEl = detailsRef.current
    if (!modalEl) return

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      if (backdropEl) backdropEl.style.opacity = '1'
      modalEl.style.opacity = '1'
      return
    }

    const lastClick = window.__lastProductCardRect
    let cardRect = null
    if (lastClick && String(lastClick.id) === String(product.id)) {
      cardRect = lastClick.rect
    } else {
      const cardEl = document.querySelector(`[data-product-card-id="${product.id}"]`)
      if (cardEl) cardRect = cardEl.getBoundingClientRect()
    }

    const modalRect = modalEl.getBoundingClientRect()

    if (cardRect && modalRect.width > 0 && modalRect.height > 0) {
      const deltaX = (cardRect.left + cardRect.width / 2) - (modalRect.left + modalRect.width / 2)
      const deltaY = (cardRect.top + cardRect.height / 2) - (modalRect.top + modalRect.height / 2)
      const scaleX = Math.max(0.08, cardRect.width / modalRect.width)
      const scaleY = Math.max(0.08, cardRect.height / modalRect.height)

      modalEl.style.transition = 'none'
      modalEl.style.transformOrigin = 'center center'
      modalEl.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scaleX}, ${scaleY})`
      modalEl.style.borderRadius = '1rem'
      modalEl.style.opacity = '0.85'
      if (detailsEl) {
        detailsEl.style.transition = 'none'
        detailsEl.style.opacity = '0.25'
      }
      if (backdropEl) {
        backdropEl.style.transition = 'none'
        backdropEl.style.opacity = '0'
      }

      void modalEl.offsetHeight

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          modalEl.style.transition = 'transform 360ms cubic-bezier(0.16, 1, 0.3, 1), opacity 260ms ease, border-radius 360ms ease'
          modalEl.style.transform = 'translate3d(0, 0, 0) scale(1, 1)'
          modalEl.style.borderRadius = '1.5rem'
          modalEl.style.opacity = '1'
          if (detailsEl) {
            detailsEl.style.transition = 'opacity 300ms ease 70ms'
            detailsEl.style.opacity = '1'
          }
          if (backdropEl) {
            backdropEl.style.transition = 'opacity 320ms cubic-bezier(0.16, 1, 0.3, 1)'
            backdropEl.style.opacity = '1'
          }
        })
      })
    } else {
      modalEl.style.transition = 'none'
      modalEl.style.transform = 'scale(0.92)'
      modalEl.style.opacity = '0'
      if (backdropEl) {
        backdropEl.style.transition = 'none'
        backdropEl.style.opacity = '0'
      }

      void modalEl.offsetHeight

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          modalEl.style.transition = 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 260ms ease'
          modalEl.style.transform = 'scale(1)'
          modalEl.style.opacity = '1'
          if (backdropEl) {
            backdropEl.style.transition = 'opacity 300ms ease'
            backdropEl.style.opacity = '1'
          }
        })
      })
    }
  }, [product.id])

  const catName = product.categoryName || product.category || 'Khác'
  const unitName = product.unitTypeName || product.unit || ''
  const icon = CATEGORY_ICONS[catName] || DEFAULT_CATEGORY_ICON
  const inStock = product.stockQuantity >= 50
  const outOfStock = product.stockQuantity <= 0

  const handleAddToCart = () => {
    onAddToCart?.(product)
    handleClose()
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={handleClose}
      style={{ opacity: 0 }}
    >
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-brand-divider/60 my-auto"
        onClick={e => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        style={{ transformOrigin: 'center center', willChange: 'transform, opacity, border-radius' }}
      >
        <button
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-neutral-100 text-ink flex items-center justify-center shadow-xs transition cursor-pointer text-sm font-bold"
          onClick={handleClose}
          aria-label="Đóng"
        >
          ✕
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="relative h-64 md:h-auto min-h-[260px] bg-neutral-100 flex items-center justify-center overflow-hidden border-b md:border-b-0 md:border-r border-brand-divider/40">
            {product.imageUrl ? (
              <img
                src={resolveMediaUrl(product.imageUrl)}
                alt={product.productName}
                decoding="async"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-brand-text/50">
                <Icon name={icon} size={72} />
              </div>
            )}
            {!inStock && (
              <span className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-lg bg-red-100 text-red-700 shadow-xs">
                {outOfStock ? 'Hết hàng' : 'Sắp hết hàng'}
              </span>
            )}
          </div>

          <div ref={detailsRef} className="p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-brand-text">
                {catName}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-ink tracking-tight mt-1" id="product-detail-title">
                {product.productName}
              </h2>
              <p className="text-xs text-brand-text mt-1">
                Mã SP: <code className="tag font-bold font-mono text-ink bg-neutral-100 px-1.5 py-0.5 rounded">{product.productCode}</code>
              </p>

              <div className="flex items-baseline gap-1 my-4">
                <span className="text-2xl font-black font-display text-primary">
                  {product.price?.toLocaleString('vi-VN')}đ
                </span>
                <span className="text-xs text-brand-text">/ {unitName}</span>
              </div>

              <div className="space-y-2.5 py-3 border-y border-brand-divider/40 text-xs sm:text-sm">
                <div className="flex justify-between">
                  <span className="text-brand-text">Đơn vị tính</span>
                  <span className="font-semibold text-ink">{unitName || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-brand-text">Tồn kho</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${product.stockQuantity < 50 ? 'text-amber-600' : 'text-emerald-700'}`}>
                    {product.stockQuantity} {unitName}
                    <Icon name={product.stockQuantity < 50 ? 'alert' : 'checkRing'} size={15} />
                  </span>
                </div>
                {product.description && (
                  <div className="pt-1">
                    <span className="text-brand-text block mb-1">Mô tả</span>
                    <p className="text-ink text-xs leading-relaxed">{product.description}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              {!hideAddToCart && (
                <button
                  className="flex-1 py-3 px-4 bg-primary hover:bg-primary-dark text-white font-extrabold font-display text-sm tracking-wide rounded-xl shadow-xs transition flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  onClick={handleAddToCart}
                  disabled={outOfStock}
                >
                  {outOfStock ? 'Hết hàng' : <><Icon name="cart" size={17} /> Thêm vào giỏ</>}
                </button>
              )}
              <button
                className={`py-3 px-5 rounded-xl font-bold font-display text-sm transition cursor-pointer ${
                  hideAddToCart
                    ? 'w-full bg-primary hover:bg-primary-dark text-white shadow-xs'
                    : 'border border-brand-divider text-ink hover:bg-neutral-100'
                }`}
                onClick={handleClose}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetailModal
