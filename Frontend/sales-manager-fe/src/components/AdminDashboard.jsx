import { useEffect, useState } from 'react'
import '../App.css'

const API = 'http://localhost:5000/api'

function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-box" style={{ borderTop: `4px solid ${color}` }}>
      <span className="stat-box-icon">{icon}</span>
      <div>
        <p className="stat-box-label">{label}</p>
        <p className="stat-box-value">{value}</p>
      </div>
    </div>
  )
}

// --------- Tab: Danh sách sản phẩm ---------
function ProductList({ products, onRefresh }) {
  const [deleting, setDeleting] = useState(null)

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận xóa sản phẩm này?')) return
    setDeleting(id)
    await fetch(`${API}/product/${id}`, { method: 'DELETE' })
    onRefresh()
    setDeleting(null)
  }

  return (
    <div>
      <h3 className="tab-title">Danh sách sản phẩm ({products.length})</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Mã SP</th>
              <th>Tên sản phẩm</th>
              <th>Danh mục</th>
              <th>Đơn vị</th>
              <th>Giá bán</th>
              <th>Tồn kho</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} className={p.stockQuantity < 50 ? 'low-stock-row' : ''}>
                <td><code>{p.productCode}</code></td>
                <td><strong>{p.productName}</strong></td>
                <td><span className="cat-tag">{p.category || 'Khác'}</span></td>
                <td>{p.unit}</td>
                <td className="price-cell">{p.price?.toLocaleString('vi-VN')}đ</td>
                <td className={p.stockQuantity < 50 ? 'warn-cell' : ''}>
                  {p.stockQuantity} {p.stockQuantity < 50 ? '⚠️' : ''}
                </td>
                <td>
                  <button
                    className="btn-danger-sm"
                    onClick={() => handleDelete(p.id)}
                    disabled={deleting === p.id}
                  >
                    {deleting === p.id ? '...' : 'Xóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// --------- Tab: Thêm sản phẩm ---------
function AddProduct({ onRefresh }) {
  const [form, setForm] = useState({
    productCode: '', productName: '', unit: '', price: '', stockQuantity: '',
    description: '', category: '', imageUrl: ''
  })
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`${API}/product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, price: +form.price, stockQuantity: +form.stockQuantity })
      })
      if (res.ok) {
        setMsg({ type: 'success', text: 'Thêm sản phẩm thành công!' })
        setForm({ productCode: '', productName: '', unit: '', price: '', stockQuantity: '', description: '', category: '', imageUrl: '' })
        onRefresh()
      } else {
        const data = await res.json()
        setMsg({ type: 'error', text: data.message || 'Có lỗi xảy ra.' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Không thể kết nối máy chủ.' })
    }
    setLoading(false)
  }

  const field = (label, key, type = 'text', required = false) => (
    <label className="form-field">
      <span>{label}{required && <span className="required">*</span>}</span>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        required={required}
        placeholder={label}
      />
    </label>
  )

  return (
    <div>
      <h3 className="tab-title">Thêm sản phẩm mới</h3>
      <div className="form-card">
        <form onSubmit={handleSubmit} className="add-product-form">
          <div className="form-row">
            {field('Mã sản phẩm', 'productCode', 'text', true)}
            {field('Tên sản phẩm', 'productName', 'text', true)}
          </div>
          <div className="form-row">
            {field('Danh mục', 'category')}
            {field('Đơn vị tính', 'unit', 'text', true)}
          </div>
          <div className="form-row">
            {field('Giá bán (VNĐ)', 'price', 'number', true)}
            {field('Số lượng ban đầu', 'stockQuantity', 'number', true)}
          </div>
          {field('Mô tả sản phẩm', 'description')}
          {field('URL hình ảnh', 'imageUrl')}
          {msg && <p className={`message ${msg.type}`}>{msg.text}</p>}
          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : '+ Thêm sản phẩm'}
          </button>
        </form>
      </div>
    </div>
  )
}

// --------- Tab: Nhập / Xuất kho ---------
function StockManager({ products }) {
  const [form, setForm] = useState({ productId: '', type: 'Import', quantity: '', unitPrice: '', note: '' })
  const [transactions, setTransactions] = useState([])
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/stock`)
      .then(r => r.json())
      .then(data => setTransactions(data))
      .catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`${API}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, productId: +form.productId, quantity: +form.quantity, unitPrice: +form.unitPrice })
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: `${form.type === 'Import' ? 'Nhập kho' : 'Xuất kho'} thành công!` })
        setForm({ productId: '', type: 'Import', quantity: '', unitPrice: '', note: '' })
        const updated = await fetch(`${API}/stock`).then(r => r.json())
        setTransactions(updated)
      } else {
        setMsg({ type: 'error', text: data.message || 'Có lỗi xảy ra.' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Không thể kết nối máy chủ.' })
    }
    setLoading(false)
  }

  return (
    <div>
      <h3 className="tab-title">Quản lý nhập / xuất kho</h3>
      <div className="stock-layout">
        <div className="form-card">
          <h4>Tạo phiếu giao dịch</h4>
          <form onSubmit={handleSubmit} className="stock-form">
            <label className="form-field">
              <span>Sản phẩm <span className="required">*</span></span>
              <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} required>
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.productCode} - {p.productName}</option>
                ))}
              </select>
            </label>
            <label className="form-field">
              <span>Loại giao dịch <span className="required">*</span></span>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                <option value="Import">📥 Nhập kho</option>
                <option value="Export">📤 Xuất kho (bán ra)</option>
              </select>
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Số lượng <span className="required">*</span></span>
                <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} required min="1" />
              </label>
              <label className="form-field">
                <span>Đơn giá (VNĐ) <span className="required">*</span></span>
                <input type="number" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} required min="0" />
              </label>
            </div>
            <label className="form-field">
              <span>Ghi chú</span>
              <input type="text" value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Nhà cung cấp, khách hàng..." />
            </label>
            {msg && <p className={`message ${msg.type}`}>{msg.text}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận giao dịch'}
            </button>
          </form>
        </div>

        <div>
          <h4>Lịch sử giao dịch gần nhất</h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Ngày</th><th>Sản phẩm</th><th>Loại</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th>Ghi chú</th></tr>
              </thead>
              <tbody>
                {transactions.slice(0, 15).map(t => (
                  <tr key={t.id}>
                    <td>{new Date(t.transactionDate).toLocaleDateString('vi-VN')}</td>
                    <td>{t.productName}</td>
                    <td>
                      <span className={t.type === 'Import' ? 'badge-import' : 'badge-export'}>
                        {t.type === 'Import' ? '📥 Nhập' : '📤 Xuất'}
                      </span>
                    </td>
                    <td>{t.quantity}</td>
                    <td>{t.unitPrice?.toLocaleString('vi-VN')}đ</td>
                    <td><strong>{(t.quantity * t.unitPrice)?.toLocaleString('vi-VN')}đ</strong></td>
                    <td>{t.note || '-'}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888' }}>Chưa có giao dịch nào</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// --------- Tab: Thống kê ---------
function Statistics({ stats }) {
  if (!stats) return <div className="loading-state"><div className="spinner" /><p>Đang tải thống kê...</p></div>

  return (
    <div>
      <h3 className="tab-title">Thống kê tổng quan</h3>
      <div className="stats-grid">
        <StatCard icon="📦" label="Tổng sản phẩm" value={stats.totalProducts} color="#4f46e5" />
        <StatCard icon="💰" label="Tổng giá trị tồn kho" value={`${stats.totalStockValue?.toLocaleString('vi-VN')}đ`} color="#0ea5e9" />
        <StatCard icon="📥" label="Tổng nhập kho" value={`${stats.totalImported?.toLocaleString('vi-VN')}đ`} color="#22c55e" />
        <StatCard icon="📤" label="Tổng bán ra" value={`${stats.totalExported?.toLocaleString('vi-VN')}đ`} color="#f97316" />
        <StatCard icon="⚠️" label="Sản phẩm sắp hết" value={stats.lowStockCount} color="#ef4444" />
      </div>

      <div className="stats-detail-grid">
        <div className="form-card">
          <h4>Thống kê theo danh mục</h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Danh mục</th><th>Số SP</th><th>Giá trị tồn</th></tr></thead>
              <tbody>
                {stats.categoryStats?.map(c => (
                  <tr key={c.category}>
                    <td>{c.category}</td>
                    <td>{c.count}</td>
                    <td>{c.totalValue?.toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-card">
          <h4>Giao dịch gần nhất</h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Sản phẩm</th><th>Loại</th><th>SL</th><th>Thành tiền</th></tr></thead>
              <tbody>
                {stats.recentTransactions?.map(t => (
                  <tr key={t.id}>
                    <td>{t.productName}</td>
                    <td>
                      <span className={t.type === 'Import' ? 'badge-import' : 'badge-export'}>
                        {t.type === 'Import' ? '📥 Nhập' : '📤 Xuất'}
                      </span>
                    </td>
                    <td>{t.quantity}</td>
                    <td>{(t.quantity * t.unitPrice)?.toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
                {!stats.recentTransactions?.length && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>Chưa có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// --------- Main Admin Dashboard ---------
function AdminDashboard({ user, onBackToHome }) {
  const [tab, setTab] = useState('list')
  const [products, setProducts] = useState([])
  const [stats, setStats] = useState(null)

  const loadProducts = () => {
    fetch(`${API}/product`).then(r => r.json()).then(setProducts).catch(() => {})
  }

  const loadStats = () => {
    fetch(`${API}/product/statistics`).then(r => r.json()).then(setStats).catch(() => {})
  }

  useEffect(() => {
    loadProducts()
    loadStats()
  }, [])

  const tabs = [
    { key: 'list', label: '📋 Sản phẩm' },
    { key: 'add', label: '➕ Thêm mới' },
    { key: 'stock', label: '📦 Nhập/Xuất kho' },
    { key: 'stats', label: '📊 Thống kê' },
  ]

  return (
    <div className="admin-shell">
      {/* Admin Header */}
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
          {tabs.map(t => (
            <button
              key={t.key}
              className={`sidebar-btn ${tab === t.key ? 'active' : ''}`}
              onClick={() => { setTab(t.key); if (t.key === 'stats') loadStats() }}
            >
              {t.label}
            </button>
          ))}

          <div className="sidebar-summary">
            <p className="sidebar-label" style={{ marginTop: 24 }}>Tổng quan nhanh</p>
            <div className="quick-stat"><span>Tổng SP:</span><strong>{products.length}</strong></div>
            <div className="quick-stat warn"><span>Sắp hết:</span><strong>{stats?.lowStockCount || 0}</strong></div>
          </div>
        </aside>

        {/* Main content */}
        <main className="admin-main">
          {tab === 'list' && <ProductList products={products} onRefresh={loadProducts} />}
          {tab === 'add' && <AddProduct onRefresh={() => { loadProducts(); loadStats() }} />}
          {tab === 'stock' && <StockManager products={products} />}
          {tab === 'stats' && <Statistics stats={stats} />}
        </main>
      </div>
    </div>
  )
}

export default AdminDashboard
