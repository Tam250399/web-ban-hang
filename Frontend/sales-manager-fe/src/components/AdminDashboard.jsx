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

/**
 * Hàm formatTime: thực thi chức năng xử lý của module
 */
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

/**
 * Component bảng điều khiển tổng quan dành cho quản trị viên
 */
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

  const loadProducts   = useCallback(() => productService.getAll().then(data => {
    const list = Array.isArray(data) ? data : []
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0))
    setProducts(list)
  }).catch(() => {}), [])
  const loadCategories = useCallback(() => categoryService.getCategories().then(setCategories).catch(() => {}), [])
  const loadUnitTypes  = useCallback(() => categoryService.getUnitTypes().then(setUnitTypes).catch(() => {}), [])
  const loadStats      = useCallback(() => productService.getStatistics().then(setStats).catch(() => {}), [])
  const loadPendingOrders = useCallback(() => orderService.getAll('Pending').then(data => {
    const list = Array.isArray(data) ? data : []
    list.sort((a, b) => new Date(b.confirmedAt || b.createdAt || 0) - new Date(a.confirmedAt || a.createdAt || 0) || (b.id || 0) - (a.id || 0))
    setPendingOrders(list)
  }).catch(() => {}), [])

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
    navigate(PATHS.adminTab(target.slug), { viewTransition: true })
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
    <div className="h-screen flex flex-col bg-brand-bg text-ink overflow-hidden">
      <PageMeta title={`Quản trị · ${(activeTab ?? DEFAULT_ADMIN_TAB).label}`} noIndex />

      <header className="sticky top-0 z-40 bg-ink text-white px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between shadow-md shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary text-white font-black font-display flex items-center justify-center text-sm shadow-xs">
            VL
          </div>
          <div>
            <strong className="block text-sm font-extrabold font-display leading-tight text-white">
              Admin Dashboard
            </strong>
            <span className="block text-[10px] text-neutral-400">Vật Liệu Xây Dựng Lý Sáu</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative" ref={notifRef}>
            <button
              className="relative h-9 w-9 rounded-xl text-neutral-300 hover:text-white hover:bg-white/10 transition cursor-pointer inline-flex items-center justify-center"
              onClick={() => setNotifOpen(o => !o)}
              title="Thông báo"
            >
              <Icon name="bell" size={19} />
              {(pendingOrdersCount + unreadTotal) > 0 && (
                <span className="absolute -top-1 -right-1 min-w-4.5 h-4.5 px-1 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {(pendingOrdersCount + unreadTotal) > 99 ? '99+' : pendingOrdersCount + unreadTotal}
                </span>
              )}
            </button>
            {notifOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white text-ink rounded-2xl shadow-2xl border border-brand-divider/70 p-3 z-50 max-h-96 overflow-y-auto">
                <div className="font-bold text-xs uppercase tracking-wider text-brand-text px-2 py-1.5 border-b border-brand-divider/40">
                  Thông báo
                </div>
                {pendingOrdersCount === 0 && unreadTotal === 0 && (
                  <div className="py-6 text-center text-xs text-brand-text">Không có thông báo mới</div>
                )}
                {pendingOrdersCount > 0 && (
                  <div className="py-2">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-primary px-2 mb-1">
                      <Icon name="cart" size={14} /> Đơn hàng mới ({pendingOrdersCount})
                    </p>
                    {pendingOrders.slice(0, 5).map(o => (
                      <button
                        key={o.id}
                        className="w-full text-left p-2 rounded-xl hover:bg-neutral-50 transition block cursor-pointer"
                        onClick={() => { switchTab('orders'); setNotifOpen(false) }}
                      >
                        <strong className="block text-xs text-ink truncate">#{o.id} · {o.recipientName}</strong>
                        <span className="block text-[11px] text-brand-text">
                          {o.total?.toLocaleString('vi-VN')}đ · {formatTime(o.createdAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {unreadTotal > 0 && (
                  <div className="py-2 border-t border-brand-divider/30">
                    <p className="flex items-center gap-1.5 text-xs font-bold text-sky-600 px-2 mb-1">
                      <Icon name="chat" size={14} /> Tin nhắn mới ({unreadTotal})
                    </p>
                    {conversations.filter(c => c.unreadCount > 0).slice(0, 5).map(c => (
                      <button
                        key={c.id}
                        className="w-full text-left p-2 rounded-xl hover:bg-neutral-50 transition block cursor-pointer"
                        onClick={() => {
                          setConversations(prev => prev.map(o => o.id === c.id ? { ...o, unreadCount: 0 } : o))
                          navigate(PATHS.adminTab('chat'), { viewTransition: true })
                          setActiveConversationId(c.id)
                          setNotifOpen(false)
                          window.scrollTo(0, 0)
                        }}
                      >
                        <strong className="block text-xs text-ink truncate">{c.customerName}</strong>
                        <span className="block text-[11px] text-brand-text truncate">
                          {c.lastMessage || 'Đã gửi một hình ảnh'} · {formatTime(c.lastMessageAt)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-300">
            <strong className="text-white font-semibold">{user?.fullName || user?.username}</strong>
            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">Admin</span>
          </span>
          <Link
            viewTransition
            className="h-9 px-3.5 rounded-xl border border-neutral-700 hover:bg-neutral-800 text-xs font-bold text-neutral-200 transition inline-flex items-center justify-center gap-1.5 cursor-pointer"
            to={PATHS.home}
          >
            ← Trang chủ
          </Link>
        </div>
      </header>

      <nav
        className="lg:hidden flex items-center gap-1.5 overflow-x-auto px-4 py-2 bg-ink text-neutral-300 border-t border-neutral-800 scrollbar-none shrink-0"
        ref={mobileTabContainerRef}
        aria-label="Chức năng quản lý"
      >
        {ADMIN_TABS.map(t => {
          const isActive = tab === t.key
          const count = t.key === 'orders' ? pendingOrdersCount : (t.key === 'chat' ? unreadTotal : 0)
          return (
            <button
              key={t.key}
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-primary text-white shadow-xs'
                  : 'bg-white/5 text-neutral-300 hover:bg-white/10'
              }`}
              onClick={() => switchTab(t.key)}
            >
              <Icon name={t.icon} size={15} />
              <span>{t.label}</span>
              {count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      <div className="flex-1 flex w-full overflow-hidden">
        <aside className="hidden lg:flex flex-col w-60 xl:w-64 bg-[#282520] text-neutral-200 p-3.5 border-r border-[#3A3630] shrink-0 h-full overflow-y-auto">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 mb-2">
            Quản lý
          </p>
          <div className="space-y-1">
            {SIDEBAR_GROUPS.map(group => {
              const isOpen = openGroups.has(group.key)
              const childTabs = ADMIN_TABS.filter(t => group.tabKeys.includes(t.key))
              return (
                <div key={group.key} className="space-y-1">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition text-neutral-300 hover:text-white hover:bg-white/5 cursor-pointer"
                    onClick={() => toggleGroup(group.key)}
                    aria-expanded={isOpen}
                    aria-controls={`sidebar-group-${group.key}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Icon name={group.icon} size={16} />
                      {group.label}
                    </span>
                    <span className={`text-[10px] transition-transform ${isOpen ? 'rotate-180' : ''}`}>▾</span>
                  </button>
                  {isOpen && (
                    <div className="pl-3 space-y-0.5 border-l border-neutral-700/60 ml-3" id={`sidebar-group-${group.key}`}>
                      {childTabs.map(t => (
                        <button
                          key={t.key}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            tab === t.key
                              ? 'bg-primary text-white shadow-xs font-bold'
                              : 'text-neutral-300 hover:text-white hover:bg-white/5'
                          }`}
                          onClick={() => switchTab(t.key)}
                        >
                          <span className="inline-flex items-center gap-2">
                            <Icon name={t.icon} size={15} />
                            {t.label}
                          </span>
                          {t.key === 'orders' && pendingOrdersCount > 0 && (
                            <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                              {pendingOrdersCount}
                            </span>
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
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  tab === t.key
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-neutral-300 hover:text-white hover:bg-white/5'
                }`}
                onClick={() => switchTab(t.key)}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon name={t.icon} size={16} />
                  {t.label}
                </span>
                {t.key === 'orders' && pendingOrdersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                    {pendingOrdersCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="mt-auto pt-4 border-t border-[#3A3630]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 mb-2">
              Tổng quan nhanh
            </p>
            <div className="space-y-1.5 px-3 text-xs">
              <div className="flex justify-between text-neutral-300">
                <span>Tổng SP:</span><strong className="text-white">{products.length}</strong>
              </div>
              <div className="flex justify-between text-neutral-300">
                <span>Danh mục:</span><strong className="text-white">{categories.length}</strong>
              </div>
              <div className="flex justify-between text-amber-400 font-bold">
                <span>Sắp hết:</span><strong>{stats?.lowStockCount || 0}</strong>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 h-full overflow-y-auto p-3 sm:p-4 lg:p-5 bg-brand-bg">
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
