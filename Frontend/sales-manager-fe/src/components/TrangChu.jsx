import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import '../App.css'
import Carousel from './Carousel'
import { bannerService } from '../services/bannerService'
import { productService } from '../services/productService'
import { useCart } from '../context/cart-context'
import CartDrawer from './common/CartDrawer'

const CATEGORY_ICONS = {
  'Xi măng': '🏗️',
  'Gạch': '🧱',
  'Cát - Đá': '⛏️',
  'Thép': '🔩',
  'Tôn - Mái': '🏠',
  'Cửa - Khung': '🚪',
  'Sơn': '🎨',
}

function ProductDetailModal({ product, onClose, onAddToCart }) {
  const catName  = product.categoryName  || product.category  || 'Khác'
  const unitName = product.unitTypeName  || product.unit      || ''
  const icon     = CATEGORY_ICONS[catName] || '📦'
  const inStock  = product.stockQuantity >= 50
  const outOfStock = product.stockQuantity <= 0

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="product-detail-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close product-detail-close" onClick={onClose}>✕</button>

        <div className="product-detail-body">
          {/* Ảnh */}
          <div className="product-detail-image">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.productName} />
            ) : (
              <div className="product-detail-image-placeholder">{icon}</div>
            )}
            {!inStock && <span className="low-stock-badge" style={{ position: 'absolute', top: 12, left: 12 }}>Sắp hết hàng</span>}
          </div>

          {/* Thông tin */}
          <div className="product-detail-info">
            <span className="product-category" style={{ fontSize: '0.8rem' }}>{catName}</span>
            <h2 className="product-detail-name">{product.productName}</h2>
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
              <button
                className="btn-primary product-detail-cta"
                onClick={() => onAddToCart(product)}
                disabled={outOfStock}
              >
                {outOfStock ? 'Hết hàng' : '🛒 Thêm vào giỏ'}
              </button>
              <button className="btn-ghost product-detail-cta" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProductCard({ product, onClick, onAddToCart }) {
  const catName  = product.categoryName || product.category || 'Khác'
  const unitName = product.unitTypeName || product.unit || ''
  const icon = CATEGORY_ICONS[catName] || '📦'
  const outOfStock = product.stockQuantity <= 0
  return (
    <div className="product-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="product-img-placeholder">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.productName}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <span className="product-icon">{icon}</span>
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
        <button
          type="button"
          className="btn-add-cart"
          onClick={e => { e.stopPropagation(); onAddToCart(product) }}
          disabled={outOfStock}
        >
          {outOfStock ? 'Hết hàng' : '🛒 Thêm vào giỏ'}
        </button>
      </div>
    </div>
  )
}

function TrangChu({ user, onLoginClick, onRegisterClick, onLogoutClick, onAdminClick, onMyOrdersClick }) {
  const [products, setProducts]           = useState([])
  const [loading, setLoading]             = useState(true)
  const [search, setSearch]               = useState('')
  const [activeCategory, setActiveCategory] = useState('Tất cả')
  const [menuOpen, setMenuOpen]           = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [banners, setBanners]             = useState([])
  const [cartOpen, setCartOpen]           = useState(false)
  const { addItem, totalCount } = useCart()

  const handleAddToCart = (product) => {
    addItem(product, 1)
    toast.success(`Đã thêm "${product.productName}" vào giỏ hàng.`)
  }

  useEffect(() => {
    productService.getAll()
      .then(data => { setProducts(data); setLoading(false) })
      .catch(() => setLoading(false))
    bannerService.getActive().then(setBanners).catch(() => {})
  }, [])

  const categories = ['Tất cả', ...new Set(products.map(p => p.categoryName || p.category || 'Khác'))]

  const filtered = products.filter(p => {
    const cat = p.categoryName || p.category || 'Khác'
    const matchCat = activeCategory === 'Tất cả' || cat === activeCategory
    const matchSearch = p.productName?.toLowerCase().includes(search.toLowerCase()) ||
      p.productCode?.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const isAdmin = user?.role === 'Admin'
  const isLoggedIn = user && user.username !== 'guest'

  return (
    <div className="site-wrapper">
      {/* HEADER */}
      <header className="site-header">
        <div className="header-inner">
          <div className="brand">
            <div className="brand-icon">ĐL</div>
            <div>
              <strong>Cửa Hàng VLXD Đức Lợi</strong>
              <span>Nhà phân phối xi măng Sài Sơn</span>
            </div>
          </div>

          <nav className="header-nav">
            <a href="#products">Sản phẩm</a>
            <a href="#about">Về chúng tôi</a>
            <a href="#contact">Liên hệ</a>
          </nav>

          <div className="header-actions">
            <button className="cart-icon-btn" onClick={() => setCartOpen(true)} aria-label="Giỏ hàng">
              🛒
              {totalCount > 0 && <span className="cart-icon-badge">{totalCount}</span>}
            </button>
            {isLoggedIn ? (
              <>
                <span className="user-greeting">
                  Xin chào, <strong>{user.fullName || user.username}</strong>
                  {isAdmin && <span className="role-badge">Admin</span>}
                </span>
                {!isAdmin && (
                  <button className="btn-ghost" onClick={onMyOrdersClick}>📦 Đơn hàng</button>
                )}
                {isAdmin && (
                  <button className="btn-admin" onClick={onAdminClick}>⚙️ Quản trị</button>
                )}
                <button className="btn-ghost" onClick={onLogoutClick}>Đăng xuất</button>
              </>
            ) : (
              <>
                <button className="btn-ghost" onClick={onLoginClick}>Đăng nhập</button>
              </>
            )}
          </div>

          {/* Hamburger — chỉ hiện trên mobile */}
          <button className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
        </div>

        {/* Mobile menu */}
        <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
          <a href="#products" onClick={() => setMenuOpen(false)}>🏗️ Sản phẩm</a>
          <a href="#about" onClick={() => setMenuOpen(false)}>ℹ️ Về chúng tôi</a>
          <a href="#contact" onClick={() => setMenuOpen(false)}>📞 Liên hệ</a>
          <div className="mobile-divider" />
          <button onClick={() => { setMenuOpen(false); setCartOpen(true) }}>
            🛒 Giỏ hàng {totalCount > 0 && `(${totalCount})`}
          </button>
          {isLoggedIn ? (
            <>
              <span style={{ padding: '8px 14px', fontSize: '0.88rem', color: 'var(--text)' }}>
                Xin chào, <strong>{user.fullName || user.username}</strong>
                {isAdmin && <span className="role-badge" style={{ marginLeft: 6 }}>Admin</span>}
              </span>
              {!isAdmin && (
                <button onClick={() => { setMenuOpen(false); onMyOrdersClick() }}>📦 Đơn hàng của tôi</button>
              )}
              {isAdmin && (
                <button onClick={() => { setMenuOpen(false); onAdminClick() }}>⚙️ Quản trị Admin</button>
              )}
              <button onClick={() => { setMenuOpen(false); onLogoutClick() }}>🚪 Đăng xuất</button>
            </>
          ) : (
            <>
              <button onClick={() => { setMenuOpen(false); onLoginClick() }}>🔐 Đăng nhập</button>
            </>
          )}
        </div>
      </header>

      <div className="hzd" />

      {/* HERO SLIDER — có banner thì chạy carousel, không có thì hiện hero mặc định */}
      <section className="hero-slider-section">
        {banners.length > 0 ? (
          <Carousel slides={banners} />
        ) : (
          <div className="hero-banner">
            <div className="hero-content">
              <p className="hero-eyebrow chip-rotate tag">Cửa Hàng Vật Liệu Xây Dựng Đức Lợi — Nhà phân phối xi măng Sài Sơn</p>
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

      {/* PRODUCTS SECTION */}
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
                {CATEGORY_ICONS[cat] || ''} {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Đang tải sản phẩm...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>Không tìm thấy sản phẩm phù hợp</p>
          </div>
        ) : (
          <div className="product-grid">
            {filtered.map(p => (
              <ProductCard key={p.id} product={p} onClick={() => setSelectedProduct(p)} onAddToCart={handleAddToCart} />
            ))}
          </div>
        )}
      </section>

      <div className="hzd" style={{ marginTop: 64 }} />

      {/* ABOUT */}
      <section id="about" className="about-section">
        <div className="about-content">
          <h2>Tại sao chọn chúng tôi?</h2>
          <div className="feature-cards">
            <div className="feature-card">
              <span className="feature-icon">🏆</span>
              <h3>Chất lượng đảm bảo</h3>
              <p>Tất cả sản phẩm đều có chứng nhận chất lượng, xuất xứ rõ ràng</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">🚚</span>
              <h3>Giao hàng nhanh</h3>
              <p>Giao hàng tận công trình trong vòng 24h tại khu vực nội thành</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">💰</span>
              <h3>Giá cạnh tranh</h3>
              <p>Cam kết giá tốt nhất thị trường, chiết khấu đặc biệt cho đơn lớn</p>
            </div>
            <div className="feature-card">
              <span className="feature-icon">📞</span>
              <h3>Hỗ trợ 24/7</h3>
              <p>Đội ngũ tư vấn chuyên nghiệp luôn sẵn sàng hỗ trợ bạn</p>
            </div>
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="contact-section">
        <h2>Liên hệ với chúng tôi</h2>
        <div className="contact-grid">
          <div className="contact-info">
            <p>📍 Khánh Tân, Sài Sơn, Quốc Oai, Hà Nội</p>
            <p>📞 0901 234 567</p>
            <p>✉️ info@vlxdpro.vn</p>
            <p>🕐 Thứ 2 - Thứ 7: 7:00 - 18:00</p>
          </div>
        </div>
      </section>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={(p) => { handleAddToCart(p); setSelectedProduct(null) }}
        />
      )}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        user={user}
        isLoggedIn={isLoggedIn}
        onLoginClick={onLoginClick}
        onOrdered={onMyOrdersClick}
      />

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="hzd" />
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="brand-icon">ĐL</div>
            <div>
              <strong>Cửa Hàng VLXD Đức Lợi</strong>
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
              <a href="#contact">Liên hệ</a>
              <a href="#about">Về chúng tôi</a>
            </div>
          </div>
          <p className="footer-copy">© 2026 Cửa Hàng Vật Liệu Xây Dựng Đức Lợi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default TrangChu
