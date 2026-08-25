import { CATEGORY_ICONS } from './categoryIcons'
import { resolveMediaUrl } from '../services/config'
import { useModalA11y } from '../hooks/useModalA11y'

// Modal chi tiet san pham. Duoc mo boi route /san-pham/:id nen link chia se
// duoc, va dong lai la quay ve trang chu qua nut Back cua trinh duyet.
function ProductDetailModal({ product, onClose, onAddToCart, hideAddToCart }) {
  // Escape để đóng, khoá cuộn nền, giữ tiêu điểm bên trong và trả về đúng chỗ
  // khi đóng — xem src/hooks/useModalA11y.js.
  const dialogRef = useModalA11y({ onClose })

  const catName  = product.categoryName  || product.category  || 'Khác'
  const unitName = product.unitTypeName  || product.unit      || ''
  const icon     = CATEGORY_ICONS[catName] || '📦'
  const inStock  = product.stockQuantity >= 50
  const outOfStock = product.stockQuantity <= 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="product-detail-modal"
        onClick={e => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
      >
        <button className="modal-close product-detail-close" onClick={onClose} aria-label="Đóng">✕</button>

        <div className="product-detail-body">
          {/* Ảnh */}
          <div className="product-detail-image">
            {product.imageUrl ? (
              <img src={resolveMediaUrl(product.imageUrl)} alt={product.productName} decoding="async" />
            ) : (
              <div className="product-detail-image-placeholder">{icon}</div>
            )}
            {!inStock && <span className="low-stock-badge" style={{ position: 'absolute', top: 12, left: 12 }}>Sắp hết hàng</span>}
          </div>

          {/* Thông tin */}
          <div className="product-detail-info">
            <span className="product-category" style={{ fontSize: '0.8rem' }}>{catName}</span>
            <h2 className="product-detail-name" id="product-detail-title">{product.productName}</h2>
            <p className="product-detail-code">Mã SP: <code className="tag">{product.productCode}</code></p>

            <div className="product-detail-price-row">
              <span className="product-detail-price">{product.price?.toLocaleString('vi-VN')}đ</span>
              <span className="product-detail-unit">/ {unitName}</span>
            </div>

            <div className="product-detail-meta">
              <div className="product-detail-row">
                <span className="product-detail-label">Đơn vị tính</span>
                <span>{unitName || '—'}</span>
              </div>
              <div className="product-detail-row">
                <span className="product-detail-label">Tồn kho</span>
                <span className={product.stockQuantity < 50 ? 'warn-text' : 'ok-text'}>
                  {product.stockQuantity} {unitName} {product.stockQuantity < 50 ? '⚠️' : '✅'}
                </span>
              </div>
              {product.description && (
                <div className="product-detail-row" style={{ flexDirection: 'column', gap: 4 }}>
                  <span className="product-detail-label">Mô tả</span>
                  <span style={{ color: 'var(--text)', lineHeight: 1.6 }}>{product.description}</span>
                </div>
              )}
            </div>

            <div className="product-detail-cta-row">
              {/* Admin chỉ tra cứu thông tin sản phẩm, không đặt hàng. */}
              {!hideAddToCart && (
                <button
                  className="btn-primary product-detail-cta"
                  onClick={() => onAddToCart(product)}
                  disabled={outOfStock}
                >
                  {outOfStock ? 'Hết hàng' : '🛒 Thêm vào giỏ'}
                </button>
              )}
              <button
                className={`${hideAddToCart ? 'btn-primary' : 'btn-ghost'} product-detail-cta`}
                onClick={onClose}
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
