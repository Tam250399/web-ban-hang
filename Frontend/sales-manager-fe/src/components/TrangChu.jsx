import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import '../App.css'
import Carousel from './Carousel'
import { bannerService } from '../services/bannerService'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import { contactService } from '../services/contactService'
import { useCart } from '../context/cart-context'
import { useAuth } from '../context/auth-context'
import { useCachedResource } from '../hooks/useCachedResource'
import { CACHE_KEYS, formatCacheAge } from '../services/cache'
import CartDrawer from './common/CartDrawer'
import LogoBadge from './LogoBadge'
import { Icon } from './common/Icon'
import { CATEGORY_ICONS, DEFAULT_CATEGORY_ICON } from './categoryIcons'
import { resolveMediaUrl } from '../services/config'
import { useDebouncedValue } from '../hooks/useDebouncedValue'
import { PATHS } from '../routes/paths'

const PAGE_SIZE = 12

/**
 * Thẻ hiển thị thông tin tóm tắt và giá của một sản phẩm
 */
const ProductCard = memo(function ProductCard({ product, onAddToCart, hideAddToCart, index = 0 }) {
  const catName = product.categoryName || product.category || 'Khác'
  const unitName = product.unitTypeName || product.unit || ''
  const icon = CATEGORY_ICONS[catName] || DEFAULT_CATEGORY_ICON
  const outOfStock = product.stockQuantity <= 0

  return (
    <Link
      data-product-card-id={product.id}
      style={{ animationDelay: `${Math.min((index % 12) * 45, 450)}ms` }}
      className="group animate-card-entrance flex flex-col bg-white rounded-2xl overflow-hidden border border-brand-divider/60 shadow-xs hover:shadow-xl hover:shadow-primary/5 hover:border-primary/40 hover:-translate-y-1.5 active:scale-[0.98] transition-all duration-300 ease-out will-change-transform"
      to={PATHS.productDetail(product.id)}
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        window.__lastProductCardRect = {
          id: product.id,
          rect: {
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
          },
        }
      }}
    >
      <div className="relative h-44 bg-neutral-100 flex items-center justify-center overflow-hidden border-b border-brand-divider/40">
        {/* Shimmer sweep effect on hover */}
        <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[-20deg]" />
        </div>

        {product.imageUrl ? (
          <img
            src={resolveMediaUrl(product.imageUrl)}
            alt={product.productName}
            width={320}
            height={140}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          />
        ) : (
          <span className="text-brand-text/70 group-hover:scale-115 group-hover:text-primary transition-all duration-300 ease-out">
            <Icon name={icon} size={44} />
          </span>
        )}
        <span className="absolute top-2 left-2 tag chip-rotate text-[11px] group-hover:rotate-0 group-hover:scale-105 transition-transform duration-300 ease-out shadow-xs z-20">
          {product.productCode}
        </span>
        {product.stockQuantity < 50 && (
          <span
            className={`absolute top-2 right-2 text-[11px] font-bold px-2 py-0.5 rounded-md shadow-xs z-20 transition-transform duration-300 group-hover:scale-105 ${
              outOfStock ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'
            }`}
          >
            {outOfStock ? 'Hết hàng' : 'Sắp hết'}
          </span>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <span className="text-[11px] font-bold uppercase tracking-wider text-brand-text mb-1 group-hover:text-brand-text/80 transition-colors">
          {catName}
        </span>
        <h3 className="text-base font-bold text-ink mb-1 group-hover:text-primary transition-colors duration-200 line-clamp-2">
          {product.productName}
        </h3>
        <p className="text-xs text-brand-text mb-3 line-clamp-2 flex-1 leading-relaxed">
          {product.description}
        </p>
        <div className="flex items-baseline justify-between pt-2 border-t border-brand-divider/30 mb-3">
          <div>
            <span className="text-base font-extrabold font-display text-primary group-hover:scale-105 inline-block transition-transform duration-200 origin-left">
              {product.price?.toLocaleString('vi-VN')}đ
            </span>
            <span className="text-xs text-brand-text ml-0.5">/{unitName}</span>
          </div>
          <span className="text-xs text-brand-text">Còn: {product.stockQuantity} {unitName}</span>
        </div>
        {!hideAddToCart && (
          <button
            type="button"
            className="group/btn w-full py-2 px-3 bg-primary hover:bg-primary-dark text-white font-extrabold font-display text-sm tracking-wide rounded-xl shadow-xs hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            onClick={e => { e.preventDefault(); e.stopPropagation(); onAddToCart(product) }}
            disabled={outOfStock}
          >
            {outOfStock ? (
              'Hết hàng'
            ) : (
              <>
                <span className="transition-transform duration-200 group-hover/btn:-rotate-12 group-hover/btn:scale-110 inline-flex">
                  <Icon name="cart" size={16} />
                </span>
                <span>Thêm vào giỏ</span>
              </>
            )}
          </button>
        )}
      </div>
    </Link>
  )
})

/**
 * Component trang chủ: hiển thị danh mục, banner và danh sách sản phẩm
 */
function TrangChu() {
  const navigate = useNavigate()
  const { user, isAdmin, isLoggedIn, logout } = useAuth()
  const canBuy = !isAdmin
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [activeCategory, setActiveCategory] = useState('Tất cả')

  const handleCategoryChange = useCallback((cat) => {
    setActiveCategory(cat)
  }, [])
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [menuOpen, setMenuOpen] = useState(false)
  const [banners, setBanners] = useState([])
  const [homeCategories, setHomeCategories] = useState([])
  const [contact, setContact] = useState(null)
  const [cartOpen, setCartOpen] = useState(false)
  const { addItem, totalCount } = useCart()

  const handleAddToCart = useCallback((product) => {
    addItem(product, 1)
    toast.success(`Đã thêm "${product.productName}" vào giỏ hàng.`)
  }, [addItem])

  const {
    data: productData,
    loading,
    isStale,
    cachedAt,
    isOnline,
  } = useCachedResource(CACHE_KEYS.products, () => productService.getAll())

  const products = useMemo(() => {
    const list = Array.isArray(productData) ? [...productData] : []
    return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0))
  }, [productData])

  useEffect(() => {
    bannerService.getActive().then(setBanners).catch(() => {})
    categoryService.getHomeCategories().then(setHomeCategories).catch(() => {})
    contactService.getActive().then(setContact).catch(() => {})
  }, [])

  const categories = useMemo(
    () => ['Tất cả', ...homeCategories.map(c => c.name)],
    [homeCategories]
  )

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    return products.filter(p => {
      const cat = p.categoryName || p.category || 'Khác'
      if (activeCategory !== 'Tất cả' && cat !== activeCategory) return false
      if (!q) return true
      return p.productName?.toLowerCase().includes(q) || p.productCode?.toLowerCase().includes(q)
    })
  }, [products, debouncedSearch, activeCategory])

  const filterKey = `${debouncedSearch}|${activeCategory}`
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setVisibleCount(PAGE_SIZE)
  }

  const displayed = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount])
  const hasMore = displayed.length < filtered.length

  return (
    <div className="min-h-screen flex flex-col bg-brand-bg text-ink">
      <header className="sticky top-0 z-40 bg-brand-bg/95 backdrop-blur-md border-b border-brand-divider/60">
        <div className="w-full max-w-[1536px] mx-auto px-4 sm:px-8 lg:px-12 h-20 flex items-center justify-between gap-6">
          <Link to={PATHS.home} viewTransition className="flex items-center gap-3.5 select-none shrink-0">
            <div className="shrink-0"><LogoBadge size={44} variant="reversed" /></div>
            <div>
              <strong className="block text-lg sm:text-xl font-bold leading-snug text-ink tracking-tight">
                Cửa Hàng VLXD Lý Sáu
              </strong>
              <span className="block text-xs text-brand-text font-medium">
                Nhà phân phối xi măng Sài Sơn
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-[15px] sm:text-base font-semibold text-ink">
            <a href="#products" className="hover:text-primary transition-colors py-1">Sản phẩm</a>
            <a href="#about" className="hover:text-primary transition-colors py-1">Về chúng tôi</a>
            {contact && <a href="#contact" className="hover:text-primary transition-colors py-1">Liên hệ</a>}
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            {canBuy && (
              <button
                className="relative h-10 w-10 inline-flex items-center justify-center text-ink hover:bg-black/5 rounded-xl transition cursor-pointer"
                onClick={() => setCartOpen(true)}
                aria-label="Giỏ hàng"
              >
                <Icon name="cart" size={22} />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow">
                    {totalCount}
                  </span>
                )}
              </button>
            )}
            {isLoggedIn ? (
              <div className="flex items-center gap-2.5">
                <span className="text-sm text-brand-text">
                  Xin chào, <strong className="text-ink font-bold">{user.fullName || user.username}</strong>
                  {isAdmin && (
                    <span className="ml-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-xs font-bold">
                      Admin
                    </span>
                  )}
                </span>
                {!isAdmin && (
                  <Link
                    viewTransition
                    className="h-10 px-4 rounded-xl border border-brand-divider hover:bg-neutral-100 text-sm font-semibold text-ink transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    to={PATHS.myOrders}
                  >
                    <Icon name="box" size={16} /> Đơn hàng
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    viewTransition
                    className="h-10 px-4 rounded-xl bg-admin-dark hover:bg-admin-dark-active text-white text-sm font-semibold border border-transparent transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                    to={PATHS.admin}
                  >
                    <Icon name="settings" size={16} /> Quản trị
                  </Link>
                )}
                <button
                  className="h-10 px-4 rounded-xl border border-brand-divider hover:bg-neutral-100 text-sm font-semibold text-ink transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  onClick={logout}
                >
                  <Icon name="logout" size={15} /> Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  viewTransition
                  className="h-10 px-4.5 rounded-xl border border-brand-divider hover:bg-white text-sm font-semibold text-ink transition inline-flex items-center justify-center cursor-pointer shadow-2xs"
                  to={PATHS.login}
                >
                  Đăng nhập
                </Link>
                <Link
                  viewTransition
                  className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-bold shadow-xs hover:shadow-md transition inline-flex items-center justify-center cursor-pointer"
                  to={PATHS.register}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 sm:hidden">
            {canBuy && (
              <button
                className="relative h-10 w-10 inline-flex items-center justify-center text-ink hover:bg-black/5 rounded-xl transition cursor-pointer"
                onClick={() => setCartOpen(true)}
                aria-label="Giỏ hàng"
              >
                <Icon name="cart" size={22} />
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 bg-primary text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow">
                    {totalCount}
                  </span>
                )}
              </button>
            )}
            <button
              className="h-10 w-10 inline-flex items-center justify-center rounded-xl text-ink hover:bg-black/5 cursor-pointer"
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Menu"
            >
              <Icon name={menuOpen ? 'close' : 'settings'} size={24} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden px-4 pt-2 pb-5 space-y-3 bg-brand-bg border-b border-brand-divider/60">
            <a href="#products" className="flex items-center gap-2.5 py-2 text-sm font-bold text-ink" onClick={() => setMenuOpen(false)}>
              <Icon name="cement" /> Sản phẩm
            </a>
            <a href="#about" className="flex items-center gap-2.5 py-2 text-sm font-bold text-ink" onClick={() => setMenuOpen(false)}>
              <Icon name="info" /> Về chúng tôi
            </a>
            {contact && (
              <a href="#contact" className="flex items-center gap-2.5 py-2 text-sm font-bold text-ink" onClick={() => setMenuOpen(false)}>
                <Icon name="phone" /> Liên hệ
              </a>
            )}
            <div className="h-px bg-brand-divider/50 my-2" />
            {isLoggedIn ? (
              <div className="space-y-2 pt-1">
                <div className="text-xs text-brand-text">
                  Xin chào, <strong className="text-ink font-bold">{user.fullName || user.username}</strong>
                  {isAdmin && <span className="ml-1.5 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-bold">Admin</span>}
                </div>
                {!isAdmin && (
                  <Link viewTransition to={PATHS.myOrders} className="flex items-center gap-2 py-2 text-sm font-bold text-ink" onClick={() => setMenuOpen(false)}>
                    <Icon name="box" /> Đơn hàng của tôi
                  </Link>
                )}
                {isAdmin && (
                  <Link viewTransition to={PATHS.admin} className="flex items-center gap-2 py-2 text-sm font-bold text-ink" onClick={() => setMenuOpen(false)}>
                    <Icon name="settings" /> Quản trị Admin
                  </Link>
                )}
                <button
                  className="flex items-center gap-2 py-2 text-sm font-bold text-red-600 cursor-pointer"
                  onClick={() => { setMenuOpen(false); logout() }}
                >
                  <Icon name="logout" /> Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex gap-2.5 pt-2">
                <Link
                  viewTransition
                  to={PATHS.login}
                  className="flex-1 py-2.5 text-center rounded-xl border border-brand-divider text-sm font-semibold text-ink hover:bg-white"
                  onClick={() => setMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  viewTransition
                  to={PATHS.register}
                  className="flex-1 py-2.5 text-center rounded-xl bg-primary text-white text-sm font-bold shadow-xs"
                  onClick={() => setMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      <div className="hzd" />

      <section className="relative overflow-hidden bg-brand-bg">
        {banners.length > 0 ? (
          <Carousel slides={banners} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8">
              <span className="tag chip-rotate text-xs mb-3">
                Cửa Hàng VLXD Lý Sáu — Nhà phân phối xi măng Sài Sơn
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold font-display tracking-tight text-ink mt-2 mb-4 leading-tight">
                Vật liệu chất lượng — <span className="text-primary">Giá tốt nhất</span>
              </h1>
              <p className="text-sm sm:text-base text-brand-text max-w-2xl mb-6 leading-relaxed">
                Chuyên bán buôn - bán lẻ: Xi măng - Sắt - Thép - Cát - Đá - Sỏi và các vật liệu xây dựng chính hãng.
                Giao hàng tận công trình, hỗ trợ tư vấn 24/7.
              </p>
              <div>
                <a
                  href="#products"
                  className="inline-block py-3 px-6 bg-primary hover:bg-primary-dark text-white font-extrabold font-display text-base tracking-wide rounded-xl shadow transition transform hover:-translate-y-0.5"
                >
                  Xem sản phẩm
                </a>
              </div>
            </div>
            <div className="lg:col-span-4 grid grid-cols-3 lg:grid-cols-1 gap-3">
              <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-brand-divider/50 shadow-xs text-center lg:text-left">
                <span className="block text-2xl sm:text-3xl font-extrabold font-display text-primary">500+</span>
                <span className="text-xs text-brand-text font-medium">Loại sản phẩm</span>
              </div>
              <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-brand-divider/50 shadow-xs text-center lg:text-left">
                <span className="block text-2xl sm:text-3xl font-extrabold font-display text-primary">1,200+</span>
                <span className="text-xs text-brand-text font-medium">Khách hàng tin dùng</span>
              </div>
              <div className="bg-white/90 backdrop-blur-xs rounded-2xl p-4 border border-brand-divider/50 shadow-xs text-center lg:text-left">
                <span className="block text-2xl sm:text-3xl font-extrabold font-display text-primary">10+</span>
                <span className="text-xs text-brand-text font-medium">Năm kinh nghiệm</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="hzd" />

      <section id="products" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-ink">
            Danh mục sản phẩm
          </h2>
          <p className="text-sm text-brand-text mt-1">
            Vật liệu xây dựng chính hãng, đảm bảo chất lượng công trình
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between mb-8">
          <div className="relative w-full lg:w-72 shrink-0">
            <input
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-brand-divider bg-white text-sm text-ink placeholder-brand-text/60 focus:outline-none focus:ring-2 focus:ring-primary shadow-xs"
              type="text"
              placeholder="Tìm kiếm sản phẩm..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
              <Icon name="search" size={16} />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                className={`inline-flex items-center gap-1.5 h-10 px-3.5 rounded-xl text-xs font-bold border transition whitespace-nowrap cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-ink border-brand-divider/70 hover:bg-neutral-50'
                }`}
                onClick={() => handleCategoryChange(cat)}
              >
                <Icon name={CATEGORY_ICONS[cat] || DEFAULT_CATEGORY_ICON} size={15} />
                <span>{cat}</span>
              </button>
            ))}
          </div>
        </div>

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
            <p className="text-sm">Đang tải sản phẩm...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-brand-text bg-white/60 rounded-2xl border border-brand-divider/40 p-8">
            {!isOnline && products.length === 0 ? (
              <>
                <p className="font-bold text-ink text-base">Chưa có dữ liệu ngoại tuyến</p>
                <p className="text-sm mt-1">Hãy kết nối mạng một lần để tải danh sách sản phẩm về máy.</p>
              </>
            ) : (
              <p className="text-sm">Không tìm thấy sản phẩm phù hợp</p>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              {displayed.map((p, idx) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={idx}
                  onAddToCart={handleAddToCart}
                  hideAddToCart={!canBuy}
                />
              ))}
            </div>
            {hasMore && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-xl border border-brand-divider bg-white hover:bg-neutral-50 text-ink font-bold font-display text-sm transition shadow-xs cursor-pointer"
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                >
                  Xem thêm ({displayed.length}/{filtered.length} sản phẩm) ↓
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <div className="hzd mt-8" />

      <section id="about" className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display tracking-tight text-ink">
            Tại sao chọn chúng tôi?
          </h2>
          <p className="text-sm text-brand-text mt-1">
            Uy tín hàng đầu trong ngành vật liệu xây dựng
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white rounded-2xl p-6 border border-brand-divider/50 shadow-xs text-center flex flex-col items-center">
            <span className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Icon name="trophy" size={28} />
            </span>
            <h3 className="text-base font-bold text-ink mb-1">Chất lượng đảm bảo</h3>
            <p className="text-xs text-brand-text leading-relaxed">Tất cả sản phẩm đều có chứng nhận chất lượng, xuất xứ rõ ràng</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-brand-divider/50 shadow-xs text-center flex flex-col items-center">
            <span className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Icon name="truck" size={28} />
            </span>
            <h3 className="text-base font-bold text-ink mb-1">Giao hàng nhanh</h3>
            <p className="text-xs text-brand-text leading-relaxed">Giao hàng tận công trình trong vòng 24h tại khu vực nội thành</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-brand-divider/50 shadow-xs text-center flex flex-col items-center">
            <span className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Icon name="money" size={28} />
            </span>
            <h3 className="text-base font-bold text-ink mb-1">Giá cạnh tranh</h3>
            <p className="text-xs text-brand-text leading-relaxed">Cam kết giá tốt nhất thị trường, chiết khấu đặc biệt cho đơn lớn</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-brand-divider/50 shadow-xs text-center flex flex-col items-center">
            <span className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
              <Icon name="phone" size={28} />
            </span>
            <h3 className="text-base font-bold text-ink mb-1">Hỗ trợ 24/7</h3>
            <p className="text-xs text-brand-text leading-relaxed">Đội ngũ tư vấn chuyên nghiệp luôn sẵn sàng hỗ trợ bạn</p>
          </div>
        </div>
      </section>

      {contact && (
        <section id="contact" className="max-w-7xl mx-auto px-4 sm:px-6 pb-14">
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-brand-divider/60 shadow-xs max-w-3xl mx-auto">
            <h2 className="text-xl font-extrabold font-display tracking-tight text-ink mb-4 text-center">
              Liên hệ với chúng tôi
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-brand-text">
              <p className="flex items-center gap-2"><Icon name="pin" size={18} className="text-primary" /> {contact.address}</p>
              <p className="flex items-center gap-2"><Icon name="phone" size={18} className="text-primary" /> {contact.phone}</p>
              <p className="flex items-center gap-2"><Icon name="mail" size={18} className="text-primary" /> {contact.email}</p>
              <p className="flex items-center gap-2"><Icon name="clock" size={18} className="text-primary" /> {contact.workingHours}</p>
            </div>
          </div>
        </section>
      )}

      <Outlet context={{ products, loading, canBuy, onAddToCart: handleAddToCart }} />

      {canBuy && (
        <CartDrawer
          open={cartOpen}
          onClose={() => setCartOpen(false)}
          user={user}
          isLoggedIn={isLoggedIn}
          onLoginClick={() => navigate(PATHS.login, { viewTransition: true })}
          onOrdered={() => navigate(PATHS.myOrders, { viewTransition: true })}
        />
      )}

      <footer className="bg-ink text-neutral-300 mt-auto">
        <div className="hzd" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
          <div className="flex flex-col md:flex-row justify-between gap-8 pb-8 border-b border-neutral-800">
            <div className="flex items-start gap-3">
              <div className="shrink-0"><LogoBadge size={40} variant="reversed" /></div>
              <div>
                <strong className="block text-base font-bold font-display text-white">
                  Cửa Hàng VLXD Lý Sáu
                </strong>
                <span className="text-xs text-neutral-400">
                  Đồng hành cùng công trình của bạn
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-8 text-xs">
              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-3">Sản phẩm</h4>
                <div className="flex flex-col space-y-2">
                  <a href="#products" className="hover:text-white transition">Xi măng</a>
                  <a href="#products" className="hover:text-white transition">Gạch</a>
                  <a href="#products" className="hover:text-white transition">Thép</a>
                  <a href="#products" className="hover:text-white transition">Cát - Đá</a>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-white uppercase tracking-wider mb-3">Hỗ trợ</h4>
                <div className="flex flex-col space-y-2">
                  {contact && <a href="#contact" className="hover:text-white transition">Liên hệ</a>}
                  <a href="#about" className="hover:text-white transition">Về chúng tôi</a>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-neutral-500 pt-6">
            © 2026 Cửa Hàng Vật Liệu Xây Dựng Lý Sáu. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default TrangChu
