import { useEffect, useState } from 'react'
import '../App.css'
import { API } from './admin/api'
import ProductList from './admin/ProductList'
import AddProduct from './admin/AddProduct'
import StockManager from './admin/StockManager'
import Statistics from './admin/Statistics'
import CategoryManager from './admin/CategoryManager'

const TABS = [
  { key: 'list',       label: '📋 Sản phẩm' },
  { key: 'add',        label: '➕ Thêm mới' },
  { key: 'stock',      label: '📦 Nhập/Xuất kho' },
  { key: 'categories', label: '🏷️ Danh mục' },
  { key: 'stats',      label: '📊 Thống kê' },
]

function AdminDashboard({ user, onBackToHome }) {
  const [tab, setTab] = useState('list')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [unitTypes, setUnitTypes] = useState([])
  const [stats, setStats] = useState(null)

  const loadProducts = () =>
    fetch(`${API}/product`).then(r => r.json()).then(setProducts).catch(() => {})

  const loadCategories = () =>
    fetch(`${API}/category/product-categories`).then(r => r.json()).then(setCategories).catch(() => {})

  const loadUnitTypes = () =>
    fetch(`${API}/category/unit-types`).then(r => r.json()).then(setUnitTypes).catch(() => {})

  const loadStats = () =>
    fetch(`${API}/product/statistics`).then(r => r.json()).then(setStats).catch(() => {})

  useEffect(() => {
    loadProducts()
    loadCategories()
    loadUnitTypes()
    loadStats()
  }, [])

  const switchTab = (key) => {
    setTab(key)
    if (key === 'stats') loadStats()
    if (key === 'categories') { loadCategories(); loadUnitTypes() }
    window.scrollTo(0, 0)
  }

  return (
    <div className="admin-shell">

      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-left">
          <div className="brand-icon">VL</div>
          <div>
            <strong>Admin Dashboard</strong>
            <span>Vật Liệu Xây Dựng Pro</span>
          </div>
        </div>
        <div className="admin-header-right">
          <span className="user-greeting">
            <strong>{user?.fullName || user?.username}</strong>
            <span className="role-badge">Admin</span>
          </span>
          <button className="btn-ghost" onClick={onBackToHome}>← Trang chủ</button>
        </div>
      </header>

      <div className="admin-body">

        {/* Sidebar */}
        <aside className="admin-sidebar">
          <p className="sidebar-label">Quản lý</p>
          {TABS.map(t => (
            <button
              key={t.key}
              className={`sidebar-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => switchTab(t.key)}
            >
              {t.label}
            </button>
          ))}

          <div className="sidebar-summary">
            <p className="sidebar-label" style={{ marginTop: 24 }}>Tổng quan nhanh</p>
            <div className="quick-stat">
              <span>Tổng SP:</span><strong>{products.length}</strong>
            </div>
            <div className="quick-stat">
              <span>Danh mục:</span><strong>{categories.length}</strong>
            </div>
            <div className="quick-stat warn">
              <span>Sắp hết:</span><strong>{stats?.lowStockCount || 0}</strong>
            </div>
          </div>
        </aside>

        {/* Nội dung chính */}
        <main className="admin-main">
          {tab === 'list' && (
            <ProductList
              products={products}
              categories={categories}
              unitTypes={unitTypes}
              onRefresh={loadProducts}
            />
          )}
          {tab === 'add' && (
            <AddProduct onRefresh={() => { loadProducts(); loadStats() }} />
          )}
          {tab === 'stock' && <StockManager products={products} />}
          {tab === 'categories' && <CategoryManager />}
          {tab === 'stats' && <Statistics stats={stats} />}
        </main>

      </div>
    </div>
  )
}

export default AdminDashboard
