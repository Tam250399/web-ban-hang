import { useEffect, useRef, useState } from 'react'
import '../App.css'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import { chatService } from '../services/chatService'
import ProductList from './admin/ProductList'
import AddProduct from './admin/AddProduct'
import StockManager from './admin/StockManager'
import Statistics from './admin/Statistics'
import CategoryManager from './admin/CategoryManager'
import BannerManager from './admin/BannerManager'
import SystemManager from './admin/SystemManager'
import ChatManager from './admin/ChatManager'

const TABS = [
  { key: 'list',       label: '📋 Sản phẩm' },
  { key: 'add',        label: '➕ Thêm mới' },
  { key: 'stock',      label: '📦 Nhập/Xuất kho' },
  { key: 'categories', label: '🏷️ Danh mục' },
  { key: 'banners',    label: '🖼️ Banner' },
  { key: 'chat',       label: '💬 Chat' },
  { key: 'stats',      label: '📊 Thống kê' },
  { key: 'system',     label: '⚙️ Hệ thống' },
]

function AdminDashboard({ user, onBackToHome }) {
  const [tab, setTab] = useState('list')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [unitTypes, setUnitTypes] = useState([])
  const [stats, setStats] = useState(null)
  const [conversations, setConversations] = useState([])
  const [activeConversationId, setActiveConversationId] = useState(null)
  const activeConversationIdRef = useRef(activeConversationId)
  useEffect(() => { activeConversationIdRef.current = activeConversationId }, [activeConversationId])

  const loadProducts   = () => productService.getAll().then(setProducts).catch(() => {})
  const loadCategories = () => categoryService.getCategories().then(setCategories).catch(() => {})
  const loadUnitTypes  = () => categoryService.getUnitTypes().then(setUnitTypes).catch(() => {})
  const loadStats      = () => productService.getStatistics().then(setStats).catch(() => {})

  useEffect(() => {
    loadProducts()
    loadCategories()
    loadUnitTypes()
    loadStats()
  }, [])

  // Kết nối chat + theo dõi hội thoại ngay khi vào Admin Dashboard, không phụ
  // thuộc tab đang mở, để chuông thông báo trên header luôn cập nhật realtime.
  useEffect(() => {
    chatService.getConversations().then(setConversations).catch(() => {})

    const handleUpdated = (conv) => {
      setConversations(prev => {
        const others = prev.filter(c => c.id !== conv.id)
        const merged = conv.id === activeConversationIdRef.current ? { ...conv, unreadCount: 0 } : conv
        return [merged, ...others].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
      })
    }
    chatService.on('ConversationUpdated', handleUpdated)
    chatService.connect().catch(() => {})

    return () => chatService.off('ConversationUpdated', handleUpdated)
  }, [])

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

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
            <span>Vật Liệu Xây Dựng</span>
          </div>
        </div>
        <div className="admin-header-right">
          <button
            className="notif-bell"
            onClick={() => switchTab('chat')}
            title="Tin nhắn khách hàng"
          >
            🔔
            {unreadTotal > 0 && <span className="notif-bell-badge">{unreadTotal > 99 ? '99+' : unreadTotal}</span>}
          </button>
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
            <AddProduct
              onRefresh={() => { loadProducts(); loadStats() }}
              onSuccess={() => { loadProducts(); loadStats(); switchTab('list') }}
            />
          )}
          {tab === 'stock' && <StockManager products={products} />}
          {tab === 'categories' && <CategoryManager />}
          {tab === 'banners' && <BannerManager />}
          {tab === 'chat' && (
            <ChatManager
              conversations={conversations}
              setConversations={setConversations}
              activeId={activeConversationId}
              setActiveId={setActiveConversationId}
            />
          )}
          {tab === 'stats' && <Statistics stats={stats} />}
          {tab === 'system' && <SystemManager currentUser={user} />}
        </main>

      </div>
    </div>
  )
}

export default AdminDashboard
