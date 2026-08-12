import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import '../App.css'
import { productService } from '../services/productService'
import { categoryService } from '../services/categoryService'
import { chatService } from '../services/chatService'
import { orderService } from '../services/orderService'
import ProductList from './admin/ProductList'
import StockManager from './admin/StockManager'
import Statistics from './admin/Statistics'
import CategoryManager from './admin/CategoryManager'
import BannerManager from './admin/BannerManager'
import SystemManager from './admin/SystemManager'
import ChatManager from './admin/ChatManager'
import CustomerManager from './admin/CustomerManager'
import OrderManager from './admin/OrderManager'

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

const TABS = [
  { key: 'list',       label: '📋 Sản phẩm' },
  { key: 'orders',     label: '🛒 Đơn hàng' },
  { key: 'stock',      label: '📦 Nhập/Xuất kho' },
  { key: 'customers',  label: '👥 Khách hàng' },
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
  const [pendingOrders, setPendingOrders] = useState([])
  const pendingOrdersCount = pendingOrders.length
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)

  const loadProducts   = () => productService.getAll().then(setProducts).catch(() => {})
  const loadCategories = () => categoryService.getCategories().then(setCategories).catch(() => {})
  const loadUnitTypes  = () => categoryService.getUnitTypes().then(setUnitTypes).catch(() => {})
  const loadStats      = () => productService.getStatistics().then(setStats).catch(() => {})
  const loadPendingOrders = () => orderService.getAll('Pending').then(setPendingOrders).catch(() => {})

  useEffect(() => {
    loadProducts()
    loadCategories()
    loadUnitTypes()
    loadStats()
    loadPendingOrders()
  }, [])

  // Theme riêng cho khu vực quản trị (bảng màu/typography khác trang bán hàng).
  // Gắn class lên <body> thay vì .admin-shell để các panel render qua Portal
  // (SearchableSelect...) vẫn nằm trong scope theme này.
  useEffect(() => {
    document.body.classList.add('admin-theme')
    return () => document.body.classList.remove('admin-theme')
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
    const handlePresence = (customerId, isOnline) => {
      setConversations(prev => prev.map(c => c.customerId === customerId ? { ...c, isOnline } : c))
    }
    const handleNewOrder = (order) => {
      loadPendingOrders()
      toast.success(`🛒 Đơn hàng mới #${order.id} từ ${order.recipientName}`)
    }
    chatService.on('ConversationUpdated', handleUpdated)
    chatService.on('CustomerPresenceChanged', handlePresence)
    chatService.on('NewOrder', handleNewOrder)
    chatService.connect().catch(() => {})

    return () => {
      chatService.off('ConversationUpdated', handleUpdated)
      chatService.off('CustomerPresenceChanged', handlePresence)
      chatService.off('NewOrder', handleNewOrder)
    }
  }, [])

  // Đóng dropdown thông báo khi bấm ra ngoài.
  useEffect(() => {
    if (!notifOpen) return
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [notifOpen])

  const unreadTotal = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  const switchTab = (key) => {
    // Rời tab Chat thì bỏ chọn hội thoại đang mở, để lần sau vào lại Chat
    // không tự động focus vào hội thoại đã mở trước đó.
    if (tab === 'chat' && key !== 'chat') setActiveConversationId(null)
    setTab(key)
    if (key === 'stats') loadStats()
    if (key === 'orders') loadPendingOrders()
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
          <div className="notif-bell-wrap" ref={notifRef}>
            <button
              className="notif-bell"
              onClick={() => setNotifOpen(o => !o)}
              title="Thông báo"
            >
              🔔
              {(pendingOrdersCount + unreadTotal) > 0 && (
                <span className="notif-bell-badge">{(pendingOrdersCount + unreadTotal) > 99 ? '99+' : pendingOrdersCount + unreadTotal}</span>
              )}
            </button>
            {notifOpen && (
              <div className="notif-dropdown">
                <div className="notif-dropdown-header">Thông báo</div>
                {pendingOrdersCount === 0 && unreadTotal === 0 && (
                  <div className="notif-empty">Không có thông báo mới</div>
                )}
                {pendingOrdersCount > 0 && (
                  <div className="notif-section">
                    <p className="notif-section-title">🛒 Đơn hàng mới ({pendingOrdersCount})</p>
                    {pendingOrders.slice(0, 5).map(o => (
                      <button
                        key={o.id}
                        className="notif-item"
                        onClick={() => { switchTab('orders'); setNotifOpen(false) }}
                      >
                        <strong>#{o.id} · {o.recipientName}</strong>
                        <span>{o.total?.toLocaleString('vi-VN')}đ · {formatTime(o.createdAt)}</span>
                      </button>
                    ))}
                  </div>
                )}
                {unreadTotal > 0 && (
                  <div className="notif-section">
                    <p className="notif-section-title">💬 Tin nhắn mới ({unreadTotal})</p>
                    {conversations.filter(c => c.unreadCount > 0).slice(0, 5).map(c => (
                      <button
                        key={c.id}
                        className="notif-item"
                        onClick={() => {
                          setConversations(prev => prev.map(o => o.id === c.id ? { ...o, unreadCount: 0 } : o))
                          setTab('chat')
                          setActiveConversationId(c.id)
                          setNotifOpen(false)
                          window.scrollTo(0, 0)
                        }}
                      >
                        <strong>{c.customerName}</strong>
                        <span>{c.lastMessage || 'Đã gửi một hình ảnh'} · {formatTime(c.lastMessageAt)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
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
              {t.key === 'orders' && pendingOrdersCount > 0 && (
                <span className="count-badge" style={{ marginLeft: 6 }}>{pendingOrdersCount}</span>
              )}
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
              onRefresh={() => { loadProducts(); loadStats() }}
            />
          )}
          {tab === 'orders' && (
            <OrderManager onChanged={() => { loadProducts(); loadStats(); loadPendingOrders() }} />
          )}
          {tab === 'stock' && <StockManager products={products} />}
          {tab === 'customers' && <CustomerManager />}
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
