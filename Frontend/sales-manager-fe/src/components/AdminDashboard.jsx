import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
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
import ContactManager from './admin/ContactManager'
import SystemManager from './admin/SystemManager'
import ChatManager from './admin/ChatManager'
import CustomerManager from './admin/CustomerManager'
import OrderManager from './admin/OrderManager'
import PageMeta from './common/PageMeta'
import { Icon } from './common/Icon'
import { useAuth } from '../context/auth-context'
import { ADMIN_TABS, DEFAULT_ADMIN_TAB, PATHS, SIDEBAR_GROUPS, adminTabBySlug } from '../routes/paths'

const GROUPED_TAB_KEYS = new Set(SIDEBAR_GROUPS.flatMap(g => g.tabKeys))

function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { tabSlug } = useParams()

  const activeTab = adminTabBySlug(tabSlug)
  const tab = activeTab?.key ?? DEFAULT_ADMIN_TAB.key

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
  const mobileTabContainerRef = useRef(null)

  useEffect(() => {
    if (!mobileTabContainerRef.current) return
    const activeEl = mobileTabContainerRef.current.querySelector('.admin-mobile-tab.active')
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [tab])

  const [openGroups, setOpenGroups] = useState(() => new Set(
    SIDEBAR_GROUPS.filter(g => g.tabKeys.includes(tab)).map(g => g.key)
  ))
  const toggleGroup = (key) => setOpenGroups(prev => {
    const next = new Set(prev)
    next.has(key) ? next.delete(key) : next.add(key)
    return next
  })

  const loadProducts   = useCallback(() => productService.getAll().then(setProducts).catch(() => {}), [])
  const loadCategories = useCallback(() => categoryService.getCategories().then(setCategories).catch(() => {}), [])
  const loadUnitTypes  = useCallback(() => categoryService.getUnitTypes().then(setUnitTypes).catch(() => {}), [])
  const loadStats      = useCallback(() => productService.getStatistics().then(setStats).catch(() => {}), [])
  const loadPendingOrders = useCallback(() => orderService.getAll('Pending').then(setPendingOrders).catch(() => {}), [])

  useEffect(() => {
    loadProducts()
    loadCategories()
    loadUnitTypes()
    loadStats()
    loadPendingOrders()
  }, [loadProducts, loadCategories, loadUnitTypes, loadStats, loadPendingOrders])

  useEffect(() => {
    if (tab === 'list' || tab === 'stock') {
      loadProducts()
      loadStats()
    }
  }, [tab, loadProducts, loadStats])

  useEffect(() => {
    document.body.classList.add('admin-theme')
    return () => document.body.classList.remove('admin-theme')
  }, [])

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
      toast.success(`Đơn hàng mới #${order.id} từ ${order.recipientName}`)
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
  }, [loadPendingOrders])

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
    if (tab === 'chat' && key !== 'chat') setActiveConversationId(null)
    const target = ADMIN_TABS.find((t) => t.key === key) ?? DEFAULT_ADMIN_TAB
    navigate(PATHS.adminTab(target.slug))
    if (key === 'stats') loadStats()
    if (key === 'orders') loadPendingOrders()
    if (key === 'categories') { loadCategories(); loadUnitTypes() }
    if (key === 'list' || key === 'stock') { loadProducts(); loadStats() }
    window.scrollTo(0, 0)
  }

  if (tabSlug && !activeTab) {
    return <Navigate to={PATHS.adminTab(DEFAULT_ADMIN_TAB.slug)} replace />
  }

  return (
    <div className="admin-shell">
      <PageMeta title={`Quản trị · ${(activeTab ?? DEFAULT_ADMIN_TAB).label}`} noIndex />

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
              <Icon name="bell" size={20} />
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
                    <p className="notif-section-title"><Icon name="cart" size={15} /> Đơn hàng mới ({pendingOrdersCount})</p>
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
                    <p className="notif-section-title"><Icon name="chat" size={15} /> Tin nhắn mới ({unreadTotal})</p>
                    {conversations.filter(c => c.unreadCount > 0).slice(0, 5).map(c => (
                      <button
                        key={c.id}
                        className="notif-item"
                        onClick={() => {
                          setConversations(prev => prev.map(o => o.id === c.id ? { ...o, unreadCount: 0 } : o))
                          navigate(PATHS.adminTab('chat'))
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
          <Link className="btn-ghost" to={PATHS.home}>← Trang chủ</Link>
        </div>
      </header>

      <nav className="admin-mobile-tabs" ref={mobileTabContainerRef} aria-label="Chức năng quản lý">
        {ADMIN_TABS.map(t => {
          const isActive = tab === t.key
          const count = t.key === 'orders' ? pendingOrdersCount : (t.key === 'chat' ? unreadTotal : 0)
          return (
            <button
              key={t.key}
              type="button"
              className={`admin-mobile-tab ${isActive ? 'active' : ''}`}
              onClick={() => switchTab(t.key)}
            >
              <Icon name={t.icon} size={15} />
              <span>{t.label}</span>
              {count > 0 && <span className="count-badge">{count}</span>}
            </button>
          )
        })}
      </nav>

      <div className="admin-body">
        <aside className="admin-sidebar">
          <p className="sidebar-label">Quản lý</p>
          {SIDEBAR_GROUPS.map(group => {
            const isOpen = openGroups.has(group.key)
            const childTabs = ADMIN_TABS.filter(t => group.tabKeys.includes(t.key))
            return (
              <div key={group.key} className="sidebar-group">
                <button
                  type="button"
                  className={`sidebar-btn sidebar-group-toggle ${isOpen ? 'open' : ''}`}
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={isOpen}
                  aria-controls={`sidebar-group-${group.key}`}
                >
                  <span className="sidebar-btn-label">
                    <Icon name={group.icon} />
                    {group.label}
                  </span>
                  <span className="sidebar-group-arrow">▾</span>
                </button>
                {isOpen && (
                  <div className="sidebar-group-body" id={`sidebar-group-${group.key}`}>
                    {childTabs.map(t => (
                      <button
                        key={t.key}
                        className={`sidebar-btn sidebar-subbtn ${tab === t.key ? 'active' : ''}`}
                        onClick={() => switchTab(t.key)}
                      >
                        <span className="sidebar-btn-label">
                          <Icon name={t.icon} />
                          {t.label}
                        </span>
                        {t.key === 'orders' && pendingOrdersCount > 0 && (
                          <span className="count-badge" style={{ marginLeft: 6 }}>{pendingOrdersCount}</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
          {ADMIN_TABS.filter(t => !GROUPED_TAB_KEYS.has(t.key)).map(t => (
            <button
              key={t.key}
              className={`sidebar-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => switchTab(t.key)}
            >
              <span className="sidebar-btn-label">
                <Icon name={t.icon} />
                {t.label}
              </span>
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
          {tab === 'stock' && (
            <StockManager
              products={products}
              onChanged={() => { loadProducts(); loadStats() }}
            />
          )}
          {tab === 'customers' && <CustomerManager />}
          {tab === 'categories' && <CategoryManager />}
          {tab === 'banners' && <BannerManager />}
          {tab === 'contact' && <ContactManager />}
          {tab === 'chat' && (
            <ChatManager
              conversations={conversations}
              setConversations={setConversations}
              activeId={activeConversationId}
              setActiveId={setActiveConversationId}
            />
          )}
          {tab === 'stats' && <Statistics stats={stats} products={products} />}
          {tab === 'system' && <SystemManager currentUser={user} />}
        </main>

      </div>
    </div>
  )
}

export default AdminDashboard
