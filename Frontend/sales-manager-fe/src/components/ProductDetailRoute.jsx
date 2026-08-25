import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import ProductDetailModal from './ProductDetailModal'
import PageMeta from './common/PageMeta'
import { PATHS } from '../routes/paths'

const formatVnd = (value) => Number(value ?? 0).toLocaleString('vi-VN')

// Route /san-pham/:productId — render modal chi tiết chồng lên trang chủ.
//
// Trước đây chi tiết sản phẩm chỉ là state trong TrangChu: không gửi link cho
// khách được, bấm Back thì thoát khỏi web thay vì đóng modal, và Google không
// thấy sản phẩm nào ngoài trang chủ.
function ProductDetailRoute() {
  const { productId } = useParams()
  const navigate = useNavigate()
  // products/onAddToCart lấy từ TrangChu qua Outlet context — không gọi lại API.
  const { products, loading, canBuy, onAddToCart } = useOutletContext()

  const product = products.find((p) => String(p.id) === String(productId))

  const close = () => navigate(PATHS.home)

  // Danh sách chưa tải xong (vd. khách mở thẳng link chia sẻ): chờ, đừng vội
  // kết luận là sản phẩm không tồn tại.
  if (loading) {
    return (
      <div className="modal-overlay" onClick={close}>
        <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
          <div className="route-loading">
            <div className="spinner" />
            <p>Đang tải sản phẩm...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="modal-overlay" onClick={close}>
        <div className="product-detail-modal" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close product-detail-close" onClick={close} aria-label="Đóng">✕</button>
          <div className="empty-state" style={{ padding: 40 }}>
            <p><strong>Không tìm thấy sản phẩm</strong></p>
            <p>Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
            <button className="btn-primary" onClick={close}>Về trang chủ</button>
          </div>
        </div>
      </div>
    )
  }

  const catName = product.categoryName || product.category || 'Khác'
  const unitName = product.unitTypeName || product.unit || ''

  return (
    <>
      <PageMeta
        title={product.productName}
        description={
          product.description
          || `${product.productName} (${catName}) — giá ${formatVnd(product.price)}đ/${unitName} tại Cửa Hàng VLXD Lý Sáu.`
        }
      />
      <ProductDetailModal
        product={product}
        onClose={close}
        hideAddToCart={!canBuy}
        onAddToCart={(p) => { onAddToCart(p); close() }}
      />
    </>
  )
}

export default ProductDetailRoute
