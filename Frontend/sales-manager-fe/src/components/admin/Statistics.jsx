import { useState, useEffect, useMemo } from 'react'
import { Icon } from '../common/Icon'
import { productService } from '../../services/productService'
import { stockService } from '../../services/stockService'
import { resolveMediaUrl } from '../../services/config'

function StatCard({ icon, label, value, color, onClick, hint = 'Bấm để xem danh sách' }) {
  return (
    <div
      className="stat-box clickable"
      style={{ borderTop: `4px solid ${color}` }}
      onClick={onClick}
      title={`${label} · ${hint}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } }}
    >
      <span className="stat-box-icon">{icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="stat-box-label">{label}</p>
        <p className="stat-box-value">{value}</p>
      </div>
      <span style={{ color: 'var(--text)', opacity: 0.45, fontSize: '0.75rem', marginLeft: 4 }}>
        ➜
      </span>
    </div>
  )
}

function StatDetailModal({ modal, onClose, products = [], transactions = [], loadingTransactions = false }) {
  const [search, setSearch] = useState('')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const keyword = search.trim().toLowerCase()

  const filteredProducts = useMemo(() => {
    let list = [...products]
    if (modal.type === 'stock_value') {
      list.sort((a, b) => ((b.stockQuantity || 0) * (b.price || 0)) - ((a.stockQuantity || 0) * (a.price || 0)))
    } else if (modal.type === 'low_stock') {
      list = list.filter(p => (p.stockQuantity ?? 0) < 50)
      list.sort((a, b) => (a.stockQuantity ?? 0) - (b.stockQuantity ?? 0))
    } else if (modal.type === 'category') {
      list = list.filter(p => (p.categoryName || p.category || 'Khác') === modal.categoryName)
    }

    if (!keyword) return list
    return list.filter(p =>
      p.productName?.toLowerCase().includes(keyword) ||
      p.productCode?.toLowerCase().includes(keyword) ||
      p.categoryName?.toLowerCase().includes(keyword) ||
      p.category?.toLowerCase().includes(keyword)
    )
  }, [products, modal, keyword])

  const filteredTransactions = useMemo(() => {
    let list = [...transactions]
    if (modal.type === 'import') {
      list = list.filter(t => t.Type === 'Import' || t.type === 'Import')
    } else if (modal.type === 'export') {
      list = list.filter(t => t.Type === 'Export' || t.type === 'Export')
    }

    if (!keyword) return list
    return list.filter(t =>
      t.productName?.toLowerCase().includes(keyword) ||
      t.productCode?.toLowerCase().includes(keyword) ||
      t.note?.toLowerCase().includes(keyword)
    )
  }, [transactions, modal, keyword])

  const totalStockQty = filteredProducts.reduce((sum, p) => sum + (p.stockQuantity || 0), 0)
  const totalStockVal = filteredProducts.reduce((sum, p) => sum + ((p.stockQuantity || 0) * (p.price || 0)), 0)
  const totalTxQty = filteredTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0)
  const totalTxAmount = filteredTransactions.reduce((sum, t) => sum + ((t.quantity || 0) * (t.unitPrice || 0)), 0)

  const isProductModal = ['products', 'stock_value', 'low_stock', 'category'].includes(modal.type)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box modal-box-xl" onClick={e => e.stopPropagation()}>
        
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {modal.type === 'products' && <Icon name="box" size={24} />}
            {modal.type === 'stock_value' && <Icon name="money" size={24} />}
            {modal.type === 'import' && <Icon name="importBox" size={24} />}
            {modal.type === 'export' && <Icon name="exportBox" size={24} />}
            {modal.type === 'low_stock' && <Icon name="alert" size={24} />}
            {modal.type === 'category' && <Icon name="tag" size={24} />}
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{modal.title}</h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: 'var(--text)' }}>
                {modal.subtitle}
              </p>
            </div>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '16px 24px' }}>
          
          {modal.type === 'low_stock' && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 8,
              background: 'oklch(0.55 0.19 24 / 0.08)',
              color: 'oklch(0.45 0.18 24)',
              border: '1px solid oklch(0.85 0.08 24)',
              fontSize: '0.86rem',
              fontWeight: 500,
              flexShrink: 0
            }}>
              <Icon name="alert" size={18} />
              <span>Các mặt hàng có số lượng tồn kho dưới 50 đơn vị cần được lên kế hoạch nhập hàng bổ sung.</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
              <input
                className="search-input"
                style={{ width: '100%', paddingLeft: 34 }}
                placeholder={isProductModal ? "Tìm kiếm theo tên sản phẩm, mã SP, danh mục..." : "Tìm kiếm theo tên sản phẩm, mã SP, ghi chú..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text)', opacity: 0.6, pointerEvents: 'none' }}>
                <Icon name="search" size={16} />
              </span>
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  style={{
                    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', padding: 4
                  }}
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            <span style={{ fontSize: '0.84rem', color: 'var(--text)' }}>
              Hiển thị <strong>{isProductModal ? filteredProducts.length : filteredTransactions.length}</strong> kết quả
            </span>
          </div>

          {isProductModal && (
            <div className="admin-table-wrap" style={{ flex: 1, minHeight: 200, maxHeight: '50vh', overflowY: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}>#</th>
                    <th style={{ width: 54 }}>Ảnh</th>
                    <th style={{ width: 100 }}>Mã SP</th>
                    <th>Tên sản phẩm</th>
                    <th>Danh mục</th>
                    <th style={{ width: 80 }}>Đơn vị</th>
                    <th className="text-right">Giá bán</th>
                    <th className="text-right">Tồn kho</th>
                    <th className="text-right">Giá trị tồn</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: 32 }}>
                        {search ? 'Không tìm thấy sản phẩm nào phù hợp' : 'Không có sản phẩm nào'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p, index) => {
                      const itemVal = (p.stockQuantity || 0) * (p.price || 0)
                      const isLowStock = (p.stockQuantity ?? 0) < 50
                      return (
                        <tr key={p.id || index} className={isLowStock ? 'low-stock-row' : ''}>
                          <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{index + 1}</td>
                          <td>
                            {p.imageUrl ? (
                              <img
                                src={resolveMediaUrl(p.imageUrl)}
                                alt={p.productName}
                                className="product-thumb"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="product-thumb-placeholder"><Icon name="brick" size={20} /></div>
                            )}
                          </td>
                          <td><code>{p.productCode}</code></td>
                          <td><strong>{p.productName}</strong></td>
                          <td><span className="cat-tag">{p.categoryName || p.category || 'Khác'}</span></td>
                          <td>{p.unitTypeName || p.unit || '-'}</td>
                          <td className="price-cell text-right">{p.price?.toLocaleString('vi-VN')}đ</td>
                          <td className={`text-right ${isLowStock ? 'warn-cell' : ''}`}>
                            {p.stockQuantity} {isLowStock && <Icon name="alert" size={14} title="Sắp hết hàng" />}
                          </td>
                          <td className="text-right font-mono" style={{ fontWeight: 600 }}>
                            {itemVal.toLocaleString('vi-VN')}đ
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!isProductModal && (
            <div className="admin-table-wrap" style={{ flex: 1, minHeight: 200, maxHeight: '50vh', overflowY: 'auto' }}>
              {loadingTransactions ? (
                <div className="loading-state" style={{ padding: 32 }}>
                  <div className="spinner" />
                  <p>Đang tải lịch sử giao dịch...</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: 44 }}>#</th>
                      <th style={{ width: 140 }}>Thời gian</th>
                      <th style={{ width: 100 }}>Mã SP</th>
                      <th>Tên sản phẩm</th>
                      <th className="text-right" style={{ width: 80 }}>Số lượng</th>
                      <th className="text-right">Đơn giá</th>
                      <th className="text-right">Thành tiền</th>
                      <th>Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: 32 }}>
                          {search ? 'Không tìm thấy giao dịch nào phù hợp' : 'Chưa có giao dịch nào'}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t, index) => {
                        const amount = (t.quantity || 0) * (t.unitPrice || 0)
                        return (
                          <tr key={t.id || index}>
                            <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{index + 1}</td>
                            <td style={{ fontSize: '0.8rem', color: 'var(--text)', whiteSpace: 'nowrap' }}>
                              {t.transactionDate ? new Date(t.transactionDate).toLocaleString('vi-VN') : '-'}
                            </td>
                            <td><code>{t.productCode || '-'}</code></td>
                            <td><strong>{t.productName}</strong></td>
                            <td className="text-right" style={{ fontWeight: 600 }}>{t.quantity}</td>
                            <td className="text-right">{t.unitPrice?.toLocaleString('vi-VN')}đ</td>
                            <td className="price-cell text-right">{amount.toLocaleString('vi-VN')}đ</td>
                            <td style={{ color: 'var(--text)', fontSize: '0.82rem' }}>{t.note || '-'}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginTop: 'auto',
            flexShrink: 0,
            padding: '12px 16px',
            background: 'oklch(0.965 0.008 255)',
            borderRadius: 8,
            fontSize: '0.88rem'
          }}>
            {isProductModal ? (
              <>
                <div>
                  Tổng số sản phẩm: <strong>{filteredProducts.length}</strong> · Tổng tồn kho: <strong>{totalStockQty.toLocaleString('vi-VN')}</strong>
                </div>
                <div>
                  Tổng giá trị tồn kho: <strong className="price-cell" style={{ fontSize: '1.05rem' }}>{totalStockVal.toLocaleString('vi-VN')}đ</strong>
                </div>
              </>
            ) : (
              <>
                <div>
                  Tổng lượt giao dịch: <strong>{filteredTransactions.length}</strong> · Tổng số lượng: <strong>{totalTxQty.toLocaleString('vi-VN')}</strong>
                </div>
                <div>
                  Tổng thành tiền: <strong className="price-cell" style={{ fontSize: '1.05rem' }}>{totalTxAmount.toLocaleString('vi-VN')}đ</strong>
                </div>
              </>
            )}
          </div>

        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>Đóng</button>
        </div>

      </div>
    </div>
  )
}

function Statistics({ stats, products: propProducts = [] }) {
  const [localProducts, setLocalProducts] = useState(propProducts)
  const [transactions, setTransactions] = useState([])
  const [loadingTransactions, setLoadingTransactions] = useState(false)
  const [activeModal, setActiveModal] = useState(null)

  useEffect(() => {
    if (propProducts && propProducts.length > 0) {
      setLocalProducts(propProducts)
    } else {
      productService.getAll().then(setLocalProducts).catch(() => {})
    }
  }, [propProducts])

  const loadTransactionsIfNeeded = async () => {
    if (transactions.length > 0) return
    setLoadingTransactions(true)
    try {
      const data = await stockService.getAll()
      setTransactions(Array.isArray(data) ? data : [])
    } catch {
      if (stats?.recentTransactions) {
        setTransactions(stats.recentTransactions)
      }
    } finally {
      setLoadingTransactions(false)
    }
  }

  const openModal = (type, extra = {}) => {
    if (type === 'import' || type === 'export' || type === 'recent') {
      loadTransactionsIfNeeded()
    }
    setActiveModal({ type, ...extra })
  }

  const closeModal = () => setActiveModal(null)

  if (!stats) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Đang tải thống kê...</p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h3 className="tab-title" style={{ margin: 0 }}>Thống kê tổng quan</h3>
        <span style={{ fontSize: '0.84rem', color: 'var(--text)' }}>
          💡 <em>Nhấn vào từng mục thống kê bên dưới để xem danh sách chi tiết</em>
        </span>
      </div>

      <div className="stats-grid">
        <StatCard
          icon={<Icon name="box" size={26} />}
          label="Tổng sản phẩm"
          value={stats.totalProducts}
          color="#C1440E"
          onClick={() => openModal('products', {
            title: 'Danh sách tất cả sản phẩm',
            subtitle: `Tổng cộng ${stats.totalProducts || localProducts.length} mặt hàng trong hệ thống`
          })}
        />
        <StatCard
          icon={<Icon name="money" size={26} />}
          label="Giá trị tồn kho"
          value={`${stats.totalStockValue?.toLocaleString('vi-VN')}đ`}
          color="#4A5560"
          onClick={() => openModal('stock_value', {
            title: 'Chi tiết giá trị tồn kho',
            subtitle: `Tổng giá trị hàng tồn: ${stats.totalStockValue?.toLocaleString('vi-VN')}đ (sắp xếp theo giá trị cao nhất)`
          })}
        />
        <StatCard
          icon={<Icon name="importBox" size={26} />}
          label="Tổng nhập kho"
          value={`${stats.totalImported?.toLocaleString('vi-VN')}đ`}
          color="#22c55e"
          onClick={() => openModal('import', {
            title: 'Lịch sử phiếu nhập kho',
            subtitle: `Tổng tiền nhập kho: ${stats.totalImported?.toLocaleString('vi-VN')}đ`
          })}
        />
        <StatCard
          icon={<Icon name="exportBox" size={26} />}
          label="Tổng bán ra"
          value={`${stats.totalExported?.toLocaleString('vi-VN')}đ`}
          color="#F2B705"
          onClick={() => openModal('export', {
            title: 'Lịch sử xuất kho / Bán ra',
            subtitle: `Tổng doanh số xuất kho: ${stats.totalExported?.toLocaleString('vi-VN')}đ`
          })}
        />
        <StatCard
          icon={<Icon name="alert" size={26} />}
          label="Sản phẩm sắp hết"
          value={stats.lowStockCount}
          color="#C1440E"
          onClick={() => openModal('low_stock', {
            title: 'Danh sách sản phẩm sắp hết hàng (< 50)',
            subtitle: `Có ${stats.lowStockCount || 0} sản phẩm có số lượng tồn kho dưới 50 đơn vị`
          })}
        />
      </div>

      <div className="stats-detail-grid">

        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Thống kê theo danh mục</h4>
            <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>Bấm danh mục để xem SP</span>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Danh mục</th>
                  <th className="text-right">Số SP</th>
                  <th className="text-right">Giá trị tồn</th>
                </tr>
              </thead>
              <tbody>
                {stats.categoryStats?.map(c => (
                  <tr
                    key={c.category}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openModal('category', {
                      categoryName: c.category,
                      title: `Sản phẩm danh mục: ${c.category}`,
                      subtitle: `${c.count} sản phẩm · Tổng giá trị: ${c.totalValue?.toLocaleString('vi-VN')}đ`
                    })}
                    title={`Xem danh sách sản phẩm thuộc danh mục ${c.category}`}
                  >
                    <td>
                      <strong>{c.category}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--primary)', marginLeft: 8, opacity: 0.7 }}>➜</span>
                    </td>
                    <td className="text-right">{c.count}</td>
                    <td className="text-right font-mono price-cell">{c.totalValue?.toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
                {!stats.categoryStats?.length && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>Chưa có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="form-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h4 style={{ margin: 0 }}>Giao dịch gần nhất</h4>
            <button
              type="button"
              className="btn-ghost"
              style={{ fontSize: '0.78rem', padding: '4px 10px' }}
              onClick={() => openModal('import', {
                title: 'Tất cả giao dịch kho',
                subtitle: 'Danh sách lịch sử nhập / xuất kho trong hệ thống'
              })}
            >
              Xem tất cả ➜
            </button>
          </div>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Loại</th>
                  <th className="text-right">SL</th>
                  <th className="text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentTransactions?.map(t => (
                  <tr
                    key={t.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => openModal(t.type === 'Import' ? 'import' : 'export', {
                      title: t.type === 'Import' ? 'Lịch sử phiếu nhập kho' : 'Lịch sử xuất kho / Bán ra',
                      subtitle: `Giao dịch ${t.productName} · SL: ${t.quantity}`
                    })}
                    title="Bấm để xem lịch sử giao dịch tương ứng"
                  >
                    <td><strong>{t.productName}</strong></td>
                    <td>
                      <span className={t.type === 'Import' ? 'badge-import' : 'badge-export'}>
                        {t.type === 'Import' ? <><Icon name="importBox" size={15} /> Nhập</> : <><Icon name="exportBox" size={15} /> Xuất</>}
                      </span>
                    </td>
                    <td className="text-right">{t.quantity}</td>
                    <td className="text-right font-mono price-cell">{(t.quantity * t.unitPrice)?.toLocaleString('vi-VN')}đ</td>
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

      {activeModal && (
        <StatDetailModal
          modal={activeModal}
          onClose={closeModal}
          products={localProducts}
          transactions={transactions}
          loadingTransactions={loadingTransactions}
        />
      )}
    </div>
  )
}

export default Statistics
