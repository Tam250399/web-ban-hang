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
const ProductCard = memo(function ProductCard({ product, onAddToCart, hideAddToCart }) {
  const catName  = product.categoryName || product.category || 'Khác'
  const unitName = product.unitTypeName || product.unit || ''
  const icon = CATEGORY_ICONS[catName] || DEFAULT_CATEGORY_ICON
  const outOfStock = product.stockQuantity <= 0
  return (
    <Link className="product-card" to={PATHS.productDetail(product.id)}>
      <div className="product-img-placeholder">
        {product.imageUrl ? (
          <img
            src={resolveMediaUrl(product.imageUrl)}
            alt={product.productName}
            width={320}
            height={140}
            loading="lazy"
            decoding="async"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span className="product-icon"><Icon name={icon} size={44} /></span>
        )}
        <span className="tag chip-rotate product-code-chip">{product.productCode}</span>
        {product.stockQuantity < 50 && (
          <span className="low-stock-badge">{outOfStock ? 'Hết hàng' : 'Sắp hết'}</span>
        )}
      </div>
      <div className="product-info">
        <span className="product-category">{catName}</span>
        <h3 className="product-name">{product.productName}</h3>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <div>
            <span className="product-price">{product.price?.toLocaleString('vi-VN')}đ</span>
            <span className="product-unit">/{unitName}</span>
          </div>
          <span className="product-stock">Còn: {product.stockQuantity} {unitName}</span>
        </div>
        {!hideAddToCart && (
          <button
            type="button"
            className="btn-add-cart"
            onClick={e => { e.preventDefault(); e.stopPropagation(); onAddToCart(product) }}
            disabled={outOfStock}
          >
            {outOfStock ? 'Hết hàng' : <><Icon name="cart" /> Thêm vào giỏ</>}
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
  const [search, setSearch]               = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [visibleCount, setVisibleCount]   = useState(PAGE_SIZE)
  const [menuOpen, setMenuOpen]           = useState(false)
  const [banners, setBanners]             = useState([])
  const [homeCategories, setHomeCategories] = useState([])
  const [contact, setContact] = useState(null)
  const [cartOpen, setCartOpen]           = useState(false)
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

  const products = useMemo(() => productData ?? [], [productData])

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
    <div className="site-wrapper">
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon"><LogoBadge size={40} variant="reversed" /></div>
            <div>
              <strong>Cửa Hàng VLXD Lý Sáu</strong>
              <span>Nhà phân phối xi măng Sài Sơn</span>
            </div>
          </div>

          <nav className="header-nav">
            <a href="#products">Sản phẩm</a>
            <a href="#about">Về chúng tôi</a>
            {contact && <a href="#contact">Liên hệ</a>}
          </nav>

          <div className="header-actions">
            {canBuy && (
              <button className="cart-icon-btn" onClick={() => setCartOpen(true)} aria-label="Giỏ hàng">
                <Icon name="cart" size={20} />
                {totalCount > 0 && <span className="cart-icon-badge">{totalCount}</span>}
              </button>
            )}
            {isLoggedIn ? (
              <>
                <span className="user-greeting">
                  Xin chào, <strong>{user.fullName || user.username}</strong>
                  {isAdmin && <span className="role-badge">Admin</span>}
                </span>
                {!isAdmin && (
                  <Link className="btn-ghost btn-icon-text" to={PATHS.myOrders}><Icon name="box" /> Đơn hàng</Link>
                )}
                {isAdmin && (
                  <Link className="btn-admin btn-icon-text" to={PATHS.admin}><Icon name="settings" /> Quản trị</Link>
                )}
                <button className="btn-ghost" onClick={logout}>Đăng xuất</button>
              </>
            ) : (
              <>
                <Link className="btn-ghost" to={PATHS.login}>Đăng nhập</Link>
                <Link className="btn-primary" to={PATHS.register}>Đăng ký</Link>
              </>
            )}
          </div>

          <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <a href="#products" onClick={() => setMenuOpen(false)}><Icon name="cement" /> Sản phẩm</a>
          <a href="#about" onClick={() => setMenuOpen(false)}><Icon name="info" /> Về chúng tôi</a>
          {contact && <a href="#contact" onClick={() => setMenuOpen(false)}><Icon name="phone" /> Liên hệ</a>}
          <div className="mobile-divider" />
          {canBuy && (
            <button onClick={() => { setMenuOpen(false); setCartOpen(true) }}>
              <Icon name="cart" /> Giỏ hàng {totalCount > 0 && `(${totalCount})`}
            </button>
          )}
          {isLoggedIn ? (
            <>
              <span style={{ padding: '8px 14px', fontSize: '0.88rem', color: 'var(--text)' }}>
                Xin chào, <strong>{user.fullName || user.username}</strong>
                {isAdmin && <span className="role-badge" style={{ marginLeft: 6 }}>Admin</span>}
              </span>
              {!isAdmin && (
                <Link to={PATHS.myOrders} onClick={() => setMenuOpen(false)}><Icon name="box" /> Đơn hàng của tôi</Link>
              )}
              {isAdmin && (
                <Link to={PATHS.admin} onClick={() => setMenuOpen(false)}><Icon name="settings" /> Quản trị Admin</Link>
              )}
              <button onClick={() => { setMenuOpen(false); logout() }}><Icon name="logout" /> Đăng xuất</button>
            </>
          ) : (
            <>
              <Link to={PATHS.login} onClick={() => setMenuOpen(false)}><Icon name="lock" /> Đăng nhập</Link>
              <Link to={PATHS.register} onClick={() => setMenuOpen(false)}><Icon name="note" /> Đăng ký</Link>
            </>
          )}
        </div>
      </header>

      <div className="hzd" />

      <section className="hero-slider-section">
        {banners.length > 0 ? (
          <Carousel slides={banners} />
        ) : (
          <div className="hero-banner">
            <div className="hero-content">
              <p className="hero-eyebrow chip-rotate tag">Cửa Hàng Vật Liệu Xây Dựng Lý Sáu — Nhà phân phối xi măng Sài Sơn</p>
              <h1>Vật liệu chất lượng — <span className="hero-accent">Giá tốt nhất</span></h1>
              <p className="hero-sub">
                Chuyên bán buôn - bán lẻ: Xi măng - Sắt - Thép - Cát - Đá - Sỏi và các vật liệu xây dựng chính hãng.
                Giao hàng tận công trình, hỗ trợ tư vấn 24/7.
              </p>
              <div className="hero-btns">
                <a href="#products" className="btn-primary">Xem sản phẩm</a>
              </div>
            </div>
            <div className="hero-stats">
              <div className="stat-card">
                <span className="stat-num">500+</span>
                <span className="stat-label">Loại sản phẩm</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">1,200+</span>
                <span className="stat-label">Khách hàng tin dùng</span>
              </div>
              <div className="stat-card">
                <span className="stat-num">10+</span>
                <span className="stat-label">Năm kinh nghiệm</span>
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="hzd" />

      <section id="products" className="products-section">
        <div className="section-header">
          <h2>Danh mục sản phẩm</h2>
          <p>Vật liệu xây dựng chính hãng, đảm bảo chất lượng</p>
        </div>

        <div className="product-controls">
          <input
            className="search-input"
            type="text"
            placeholder="Tìm kiếm sản phẩm..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <div className="category-tabs">
            {categories.map(cat => (
              <button
                key={cat}
                className={`cat-tab ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                <Icon name={CATEGORY_ICONS[cat] || DEFAULT_CATEGORY_ICON} />
                {cat}
              </button>
            ))}
          </div>
        </div>

        {isStale && !loading && (
          <div className="stale-bar" role="status">
            {isOnline
              ? `Chưa cập nhật được — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`
              : `Đang ngoại tuyến — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            {!isOnline && products.length === 0 ? (
              <>
                <p><strong>Chưa có dữ liệu ngoại tuyến</strong></p>
                <p>Hãy kết nối mạng một lần để tải danh sách sản phẩm về máy.</p>
              </>
            ) : (
              <p>Không tìm thấy sản phẩm phù hợp</p>
            )}
          </div>
        ) : (
          <>
            <div className="product-grid">
              {displayed.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={handleAddToCart}
                  hideAddToCart={!canBuy}
                />
              ))}
            </div>
            {hasMore && (
              <div className="product-load-more">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                >
                  Xem thêm ({displayed.length}/{filtered.length} sản phẩm) ↓
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <div className="hzd" style={{ marginTop: 64 }} />

      <section id="about" className="about-section">
        <div className="about-content">
          <h2>Tại sao chọn chúng tôi?</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <span className="feature-icon"><Icon name="trophy" size={30} /></span>
              <h3>Chất lượng đảm bảo</h3>
              <p>Tất cả sản phẩm đều có chứng nhận chất lượng, xuất xứ rõ ràng</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon"><Icon name="truck" size={30} /></span>
              <h3>Giao hàng nhanh</h3>
              <p>Giao hàng tận công trình trong vòng 24h tại khu vực nội thành</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon"><Icon name="money" size={30} /></span>
              <h3>Giá cạnh tranh</h3>
              <p>Cam kết giá tốt nhất thị trường, chiết khấu đặc biệt cho đơn lớn</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon"><Icon name="phone" size={30} /></span>
              <h3>Hỗ trợ 24/7</h3>
              <p>Đội ngũ tư vấn chuyên nghiệp luôn sẵn sàng hỗ trợ bạn</p>
            </div>
          </div>
        </div>
      </section>

      {contact && (
        <section id="contact" className="contact-section">
          <h2>Liên hệ với chúng tôi</h2>
          <div className="contact-grid">
            <div className="contact-info">
              <p><Icon name="pin" /> {contact.address}</p>
              <p><Icon name="phone" /> {contact.phone}</p>
              <p><Icon name="mail" /> {contact.email}</p>
              <p><Icon name="clock" /> {contact.workingHours}</p>
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
          onLoginClick={() => navigate(PATHS.login)}
          onOrdered={() => navigate(PATHS.myOrders)}
        />
      )}

      <footer className="site-footer">
        <div className="hzd" />
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-icon"><LogoBadge size={40} variant="reversed" /></div>
            <div>
              <strong>Cửa Hàng VLXD Lý Sáu</strong>
              <span>Đồng hành cùng công trình của bạn</span>
            </div>
          </div>
          <div className="footer-links">
            <div>
              <h4>Sản phẩm</h4>
              <a href="#products">Xi măng</a>
              <a href="#products">Gạch</a>
              <a href="#products">Thép</a>
              <a href="#products">Cát - Đá</a>
            </div>
            <div>
              <h4>Hỗ trợ</h4>
              {contact && <a href="#contact">Liên hệ</a>}
              <a href="#about">Về chúng tôi</a>
            </div>
          </div>
          <p className="footer-copy">© 2026 Cửa Hàng Vật Liệu Xây Dựng Lý Sáu. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default TrangChu
