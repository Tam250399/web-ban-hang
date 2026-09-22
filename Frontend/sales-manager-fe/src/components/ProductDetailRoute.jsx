import { useNavigate, useOutletContext, useParams } from 'react-router-dom'
import ProductDetailModal from './ProductDetailModal'
import PageMeta from './common/PageMeta'
import { PATHS } from '../routes/paths'

/**
 * Hàm formatVnd: thực thi chức năng xử lý của module
 */
const formatVnd = (value) => Number(value ?? 0).toLocaleString('vi-VN')

/**
 * Component ProductDetailRoute
 */
function ProductDetailRoute() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const { products, loading, canBuy, onAddToCart } = useOutletContext()

  const product = products.find((p) => String(p.id) === String(productId))

  const close = () => navigate(PATHS.home)

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in" onClick={close}>
        <div className="bg-white rounded-3xl p-8 max-w-sm w-full flex flex-col items-center justify-center shadow-2xl border border-stone-200" onClick={(e) => e.stopPropagation()}>
          <div className="w-10 h-10 border-3 border-stone-200 border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-sm font-medium text-stone-600">Đang tải sản phẩm...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in" onClick={close}>
        <div className="relative bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-stone-200 text-center" onClick={(e) => e.stopPropagation()}>
          <button
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            onClick={close}
            aria-label="Đóng"
          >
            ✕
          </button>
          <div className="space-y-3 py-2">
            <h4 className="text-lg font-bold text-stone-900">Không tìm thấy sản phẩm</h4>
            <p className="text-sm text-stone-500">Sản phẩm có thể đã ngừng kinh doanh hoặc đường dẫn không đúng.</p>
            <button
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs transition-colors mt-2"
              onClick={close}
            >
              Về trang chủ
            </button>
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
        onAddToCart={onAddToCart}
      />
    </>
  )
}

export default ProductDetailRoute
