import { useState, useEffect, useMemo } from 'react'
import { Icon } from '../common/Icon'
import { productService } from '../../services/productService'
import { stockService } from '../../services/stockService'
import { resolveMediaUrl } from '../../services/config'

/**
 * Component StatCard
 */
function StatCard({ icon, label, value, color, onClick, hint = 'Bấm để xem danh sách' }) {
  return (
    <div
      className="group relative flex items-center gap-3.5 p-4 sm:p-5 bg-white rounded-2xl border border-stone-200/80 shadow-2xs hover:shadow-md hover:border-stone-300 transition-all cursor-pointer select-none"
      style={{ borderTopWidth: '4px', borderTopColor: color }}
      onClick={onClick}
      title={`${label} · ${hint}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.() } }}
    >
      <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-stone-50 border border-stone-200/60 text-stone-700 group-hover:scale-105 group-hover:text-primary transition-all">
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider truncate">{label}</p>
        <p className="text-xl sm:text-2xl font-bold text-stone-900 mt-0.5 tracking-tight truncate">{value}</p>
      </div>
      <span className="text-stone-400 group-hover:text-primary group-hover:translate-x-0.5 text-xs shrink-0 transition-all">
        ➜
      </span>
    </div>
  )
}

/**
 * Component StatDetailModal
 */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/10 text-primary shrink-0">
              {modal.type === 'products' && <Icon name="box" size={22} />}
              {modal.type === 'stock_value' && <Icon name="money" size={22} />}
              {modal.type === 'import' && <Icon name="importBox" size={22} />}
              {modal.type === 'export' && <Icon name="exportBox" size={22} />}
              {modal.type === 'low_stock' && <Icon name="alert" size={22} />}
              {modal.type === 'category' && <Icon name="tag" size={22} />}
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">{modal.title}</h3>
              <p className="text-xs text-stone-500 mt-0.5">{modal.subtitle}</p>
            </div>
          </div>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-col gap-3 p-4 sm:p-6 overflow-hidden flex-1">
          
          {modal.type === 'low_stock' && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm font-medium shrink-0">
              <Icon name="alert" size={18} className="text-amber-600 shrink-0" />
              <span>Các mặt hàng có số lượng tồn kho dưới 50 đơn vị cần được lên kế hoạch nhập hàng bổ sung.</span>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex gap-3 items-center flex-wrap shrink-0">
            <div className="relative flex-1 min-w-[240px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
                <Icon name="search" size={16} />
              </span>
              <input
                className="w-full pl-9 pr-8 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                placeholder={isProductModal ? "Tìm kiếm theo tên sản phẩm, mã SP, danh mục..." : "Tìm kiếm theo tên sản phẩm, mã SP, ghi chú..."}
                value={search}
                onChange={e => setSearch(e.target.value)}
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                  title="Xóa tìm kiếm"
                >
                  ✕
                </button>
              )}
            </div>

            <span className="text-xs sm:text-sm text-stone-500 shrink-0">
              Hiển thị <strong className="text-stone-800">{isProductModal ? filteredProducts.length : filteredTransactions.length}</strong> kết quả
            </span>
          </div>

          {/* Products Table */}
          {isProductModal && (
            <div className="flex-1 min-h-[200px] max-h-[50vh] overflow-auto rounded-xl border border-stone-200/80 shadow-2xs">
              <table className="w-full text-left text-xs sm:text-sm text-stone-700 border-collapse">
                <thead className="bg-stone-50/90 sticky top-0 z-10 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 w-10 text-center">#</th>
                    <th className="py-2.5 px-3 w-14">Ảnh</th>
                    <th className="py-2.5 px-3 w-28">Mã SP</th>
                    <th className="py-2.5 px-3">Tên sản phẩm</th>
                    <th className="py-2.5 px-3">Danh mục</th>
                    <th className="py-2.5 px-3 w-20">Đơn vị</th>
                    <th className="py-2.5 px-3 text-right">Giá bán</th>
                    <th className="py-2.5 px-3 text-right">Tồn kho</th>
                    <th className="py-2.5 px-3 text-right">Giá trị tồn</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center text-stone-400 py-12">
                        {search ? 'Không tìm thấy sản phẩm nào phù hợp' : 'Không có sản phẩm nào'}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p, index) => {
                      const itemVal = (p.stockQuantity || 0) * (p.price || 0)
                      const isLowStock = (p.stockQuantity ?? 0) < 50
                      return (
                        <tr key={p.id || index} className={`hover:bg-stone-50/80 transition-colors ${isLowStock ? 'bg-amber-50/40' : ''}`}>
                          <td className="py-2.5 px-3 text-center text-stone-400 font-mono text-xs">{index + 1}</td>
                          <td className="py-2.5 px-3">
                            {p.imageUrl ? (
                              <img
                                src={resolveMediaUrl(p.imageUrl)}
                                alt={p.productName}
                                className="w-10 h-10 rounded-lg object-cover border border-stone-200"
                                loading="lazy"
                                decoding="async"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
                                <Icon name="brick" size={18} />
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-stone-600"><code>{p.productCode}</code></td>
                          <td className="py-2.5 px-3 font-semibold text-stone-900">{p.productName}</td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-700">
                              {p.categoryName || p.category || 'Khác'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-stone-600">{p.unitTypeName || p.unit || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">{p.price?.toLocaleString('vi-VN')}đ</td>
                          <td className={`py-2.5 px-3 text-right font-semibold ${isLowStock ? 'text-amber-700' : 'text-stone-800'}`}>
                            <span className="inline-flex items-center justify-end gap-1">
                              {p.stockQuantity}
                              {isLowStock && <Icon name="alert" size={14} className="text-amber-600" title="Sắp hết hàng" />}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-stone-800">
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

          {/* Transactions Table */}
          {!isProductModal && (
            <div className="flex-1 min-h-[200px] max-h-[50vh] overflow-auto rounded-xl border border-stone-200/80 shadow-2xs">
              {loadingTransactions ? (
                <div className="flex flex-col items-center justify-center py-12 text-stone-400 gap-2">
                  <div className="w-8 h-8 border-3 border-stone-200 border-t-primary rounded-full animate-spin" />
                  <p className="text-xs">Đang tải lịch sử giao dịch...</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs sm:text-sm text-stone-700 border-collapse">
                  <thead className="bg-stone-50/90 sticky top-0 z-10 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3 w-36">Thời gian</th>
                      <th className="py-2.5 px-3 w-28">Mã SP</th>
                      <th className="py-2.5 px-3">Tên sản phẩm</th>
                      <th className="py-2.5 px-3 text-right w-20">Số lượng</th>
                      <th className="py-2.5 px-3 text-right">Đơn giá</th>
                      <th className="py-2.5 px-3 text-right">Thành tiền</th>
                      <th className="py-2.5 px-3">Ghi chú</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center text-stone-400 py-12">
                          {search ? 'Không tìm thấy giao dịch nào phù hợp' : 'Chưa có giao dịch nào'}
                        </td>
                      </tr>
                    ) : (
                      filteredTransactions.map((t, index) => {
                        const amount = (t.quantity || 0) * (t.unitPrice || 0)
                        return (
                          <tr key={t.id || index} className="hover:bg-stone-50/80 transition-colors">
                            <td className="py-2.5 px-3 text-center text-stone-400 font-mono text-xs">{index + 1}</td>
                            <td className="py-2.5 px-3 text-xs text-stone-500 whitespace-nowrap">
                              {t.transactionDate ? new Date(t.transactionDate).toLocaleString('vi-VN') : '-'}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-xs text-stone-600"><code>{t.productCode || '-'}</code></td>
                            <td className="py-2.5 px-3 font-semibold text-stone-900">{t.productName}</td>
                            <td className="py-2.5 px-3 text-right font-semibold text-stone-800">{t.quantity}</td>
                            <td className="py-2.5 px-3 text-right font-mono text-stone-700">{t.unitPrice?.toLocaleString('vi-VN')}đ</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">{amount.toLocaleString('vi-VN')}đ</td>
                            <td className="py-2.5 px-3 text-xs text-stone-500 max-w-[200px] truncate">{t.note || '-'}</td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Footer Totals */}
          <div className="flex justify-between items-center flex-wrap gap-3 mt-auto shrink-0 p-3 sm:p-4 bg-stone-50 rounded-xl border border-stone-200/80 text-xs sm:text-sm text-stone-700">
            {isProductModal ? (
              <>
                <div>
                  Tổng số sản phẩm: <strong className="text-stone-900">{filteredProducts.length}</strong> · Tổng tồn kho: <strong className="text-stone-900">{totalStockQty.toLocaleString('vi-VN')}</strong>
                </div>
                <div>
                  Tổng giá trị tồn kho: <strong className="text-base font-bold text-primary font-mono ml-1">{totalStockVal.toLocaleString('vi-VN')}đ</strong>
                </div>
              </>
            ) : (
              <>
                <div>
                  Tổng lượt giao dịch: <strong className="text-stone-900">{filteredTransactions.length}</strong> · Tổng số lượng: <strong className="text-stone-900">{totalTxQty.toLocaleString('vi-VN')}</strong>
                </div>
                <div>
                  Tổng thành tiền: <strong className="text-base font-bold text-primary font-mono ml-1">{totalTxAmount.toLocaleString('vi-VN')}đ</strong>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Modal Footer Action */}
        <div className="px-6 py-3.5 border-t border-stone-200/80 bg-stone-50/50 flex justify-end shrink-0">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-200/70 transition-colors"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  )
}

/**
 * Component biểu đồ thống kê doanh thu và phân tích bán hàng
 */
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
      <div className="flex flex-col items-center justify-center py-20 text-stone-400 gap-3">
        <div className="w-10 h-10 border-3 border-stone-200 border-t-primary rounded-full animate-spin" />
        <p className="text-sm font-medium">Đang tải thống kê...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Title Bar */}
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg sm:text-xl font-bold text-stone-800">Thống kê tổng quan</h3>
        <span className="text-xs text-stone-500">
          💡 <em>Nhấn vào từng mục thống kê bên dưới để xem danh sách chi tiết</em>
        </span>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        <StatCard
          icon={<Icon name="box" size={24} />}
          label="Tổng sản phẩm"
          value={stats.totalProducts}
          color="#C1440E"
          onClick={() => openModal('products', {
            title: 'Danh sách tất cả sản phẩm',
            subtitle: `Tổng cộng ${stats.totalProducts || localProducts.length} mặt hàng trong hệ thống`
          })}
        />
        <StatCard
          icon={<Icon name="money" size={24} />}
          label="Giá trị tồn kho"
          value={`${stats.totalStockValue?.toLocaleString('vi-VN')}đ`}
          color="#4A5560"
          onClick={() => openModal('stock_value', {
            title: 'Chi tiết giá trị tồn kho',
            subtitle: `Tổng giá trị hàng tồn: ${stats.totalStockValue?.toLocaleString('vi-VN')}đ (sắp xếp theo giá trị cao nhất)`
          })}
        />
        <StatCard
          icon={<Icon name="importBox" size={24} />}
          label="Tổng nhập kho"
          value={`${stats.totalImported?.toLocaleString('vi-VN')}đ`}
          color="#16a34a"
          onClick={() => openModal('import', {
            title: 'Lịch sử phiếu nhập kho',
            subtitle: `Tổng tiền nhập kho: ${stats.totalImported?.toLocaleString('vi-VN')}đ`
          })}
        />
        <StatCard
          icon={<Icon name="exportBox" size={24} />}
          label="Tổng bán ra"
          value={`${stats.totalExported?.toLocaleString('vi-VN')}đ`}
          color="#d97706"
          onClick={() => openModal('export', {
            title: 'Lịch sử xuất kho / Bán ra',
            subtitle: `Tổng doanh số xuất kho: ${stats.totalExported?.toLocaleString('vi-VN')}đ`
          })}
        />
        <StatCard
          icon={<Icon name="alert" size={24} />}
          label="Sản phẩm sắp hết"
          value={stats.lowStockCount}
          color="#dc2626"
          onClick={() => openModal('low_stock', {
            title: 'Danh sách sản phẩm sắp hết hàng (< 50)',
            subtitle: `Có ${stats.lowStockCount || 0} sản phẩm có số lượng tồn kho dưới 50 đơn vị`
          })}
        />
      </div>

      {/* Two-Column Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Category Stats */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-2xs flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-stone-800 text-sm sm:text-base">Thống kê theo danh mục</h4>
            <span className="text-xs text-stone-400">Bấm danh mục để xem SP</span>
          </div>
          <div className="overflow-x-auto rounded-xl border border-stone-200/70 flex-1">
            <table className="w-full text-left text-xs sm:text-sm text-stone-700 border-collapse">
              <thead className="bg-stone-50/80 text-stone-600 font-semibold border-b border-stone-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Danh mục</th>
                  <th className="py-2.5 px-3 text-right">Số SP</th>
                  <th className="py-2.5 px-3 text-right">Giá trị tồn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stats.categoryStats?.map(c => (
                  <tr
                    key={c.category}
                    className="group hover:bg-stone-50/80 transition-colors cursor-pointer"
                    onClick={() => openModal('category', {
                      categoryName: c.category,
                      title: `Sản phẩm danh mục: ${c.category}`,
                      subtitle: `${c.count} sản phẩm · Tổng giá trị: ${c.totalValue?.toLocaleString('vi-VN')}đ`
                    })}
                    title={`Xem danh sách sản phẩm thuộc danh mục ${c.category}`}
                  >
                    <td className="py-2.5 px-3">
                      <strong className="text-stone-900 group-hover:text-primary transition-colors">{c.category}</strong>
                      <span className="text-xs text-primary ml-2 opacity-70 group-hover:translate-x-1 inline-block transition-transform">➜</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-stone-800">{c.count}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">{c.totalValue?.toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
                {!stats.categoryStats?.length && (
                  <tr><td colSpan={3} className="text-center text-stone-400 py-8">Chưa có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-2xl border border-stone-200/80 p-4 sm:p-5 shadow-2xs flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-bold text-stone-800 text-sm sm:text-base">Giao dịch gần nhất</h4>
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:text-primary/80 hover:bg-primary/10 px-2.5 py-1 rounded-lg transition-colors"
              onClick={() => openModal('import', {
                title: 'Tất cả giao dịch kho',
                subtitle: 'Danh sách lịch sử nhập / xuất kho trong hệ thống'
              })}
            >
              Xem tất cả ➜
            </button>
          </div>
          <div className="overflow-x-auto rounded-xl border border-stone-200/70 flex-1">
            <table className="w-full text-left text-xs sm:text-sm text-stone-700 border-collapse">
              <thead className="bg-stone-50/80 text-stone-600 font-semibold border-b border-stone-200 text-xs uppercase tracking-wider">
                <tr>
                  <th className="py-2.5 px-3">Sản phẩm</th>
                  <th className="py-2.5 px-3">Loại</th>
                  <th className="py-2.5 px-3 text-right">SL</th>
                  <th className="py-2.5 px-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stats.recentTransactions?.map(t => (
                  <tr
                    key={t.id}
                    className="hover:bg-stone-50/80 transition-colors cursor-pointer"
                    onClick={() => openModal(t.type === 'Import' ? 'import' : 'export', {
                      title: t.type === 'Import' ? 'Lịch sử phiếu nhập kho' : 'Lịch sử xuất kho / Bán ra',
                      subtitle: `Giao dịch ${t.productName} · SL: ${t.quantity}`
                    })}
                    title="Bấm để xem lịch sử giao dịch tương ứng"
                  >
                    <td className="py-2.5 px-3 font-semibold text-stone-900">{t.productName}</td>
                    <td className="py-2.5 px-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${
                        t.type === 'Import'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}>
                        {t.type === 'Import' ? <><Icon name="importBox" size={13} /> Nhập</> : <><Icon name="exportBox" size={13} /> Xuất</>}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-stone-800">{t.quantity}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-primary">{(t.quantity * t.unitPrice)?.toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
                {!stats.recentTransactions?.length && (
                  <tr><td colSpan={4} className="text-center text-stone-400 py-8">Chưa có dữ liệu</td></tr>
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
