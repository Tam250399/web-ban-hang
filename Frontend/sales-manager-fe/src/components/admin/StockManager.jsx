import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { stockService } from '../../services/stockService'
import { salesInvoiceService } from '../../services/salesInvoiceService'
import Pagination from '../common/Pagination'
import SearchableSelect from '../common/SearchableSelect'
import ConfirmModal from '../common/ConfirmModal'

const EMPTY_IMPORT_FORM = { productId: '', quantity: '', unitPrice: '', note: '' }
const today = () => new Date().toISOString().slice(0, 10)
const emptyItem = () => ({ productId: '', quantity: 1, unitPrice: 0 })
const currentUser = () => {
  try { return JSON.parse(localStorage.getItem('salesManagerUser') || 'null') } catch { return null }
}

function ImportModal({ products, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_IMPORT_FORM)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await stockService.create({
        ...form,
        type: 'Import',
        productId: +form.productId,
        quantity: +form.quantity,
        unitPrice: +form.unitPrice,
      })
      toast.success('Nhập kho thành công!')
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Tạo phiếu nhập kho</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="stock-form">
          <label className="form-field">
            <span>Sản phẩm <span className="required">*</span></span>
            <select value={form.productId} onChange={set('productId')} required autoFocus>
              <option value="">-- Chọn sản phẩm --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.productCode} - {p.productName}</option>
              ))}
            </select>
          </label>

          <div className="row">
            <label className="form-field">
              <span>Số lượng <span className="required">*</span></span>
              <input type="number" value={form.quantity} onChange={set('quantity')} required min="1" />
            </label>
            <label className="form-field">
              <span>Đơn giá (VNĐ) <span className="required">*</span></span>
              <input type="number" value={form.unitPrice} onChange={set('unitPrice')} required min="0" />
            </label>
          </div>

          <label className="form-field">
            <span>Ghi chú</span>
            <input type="text" value={form.note} onChange={set('note')} placeholder="Nhà cung cấp..." />
          </label>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận nhập kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ImportPanel({ products, transactions, reload }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showModal, setShowModal] = useState(false)

  const handleSaved = () => {
    setShowModal(false)
    setPage(1)
    reload()
  }

  const filtered = transactions.filter(t => {
    const tDate = t.transactionDate.slice(0, 10)
    const matchSearch = !search.trim() || t.productName?.toLowerCase().includes(search.trim().toLowerCase())
    const matchFrom = !fromDate || tDate >= fromDate
    const matchTo = !toDate || tDate <= toDate
    return matchSearch && matchFrom && matchTo
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const hasFilters = search || fromDate || toDate

  const clearFilters = () => { setSearch(''); setFromDate(''); setToDate(''); setPage(1) }

  return (
    <div>
      <div className="list-header">
        <h4>
          Lịch sử nhập kho
          <span className="count-badge" style={{ marginLeft: 8 }}>{filtered.length}</span>
        </h4>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Thêm phiếu nhập</button>
      </div>

      <div>
        <div className="admin-filter-bar">
          <input
            className="search-input"
            placeholder="Tìm theo sản phẩm..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <label className="admin-filter-date">
            <span>Từ ngày</span>
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }} />
          </label>
          <label className="admin-filter-date">
            <span>Đến ngày</span>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }} />
          </label>
          {hasFilters && <button type="button" className="btn-ghost" onClick={clearFilters}>Xóa lọc</button>}
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th><th>Ngày</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((t, i) => (
                <tr key={t.id}>
                  <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                  <td>{new Date(t.transactionDate).toLocaleDateString('vi-VN')}</td>
                  <td>{t.productName}</td>
                  <td>{t.quantity}</td>
                  <td>{t.unitPrice?.toLocaleString('vi-VN')}đ</td>
                  <td><strong>{(t.quantity * t.unitPrice)?.toLocaleString('vi-VN')}đ</strong></td>
                  <td>{t.note || '-'}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 24 }}>
                  {transactions.length === 0 ? 'Chưa có giao dịch nhập kho nào' : 'Không tìm thấy giao dịch phù hợp'}
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          page={page} totalPages={totalPages} total={filtered.length} pageSize={pageSize}
          onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
          label="giao dịch" onPage={setPage}
        />
      </div>

      {showModal && (
        <ImportModal
          products={products}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}

function CreateInvoiceModal({ products, invoice, onClose, onSaved }) {
  const isEdit = !!invoice
  const [customerName, setCustomerName] = useState(invoice?.customerName || '')
  const [invoiceDate, setInvoiceDate] = useState(invoice ? invoice.invoiceDate.slice(0, 10) : today())
  const [items, setItems] = useState(
    invoice?.items?.length
      ? invoice.items.map(it => ({ productId: String(it.productId), quantity: it.quantity, unitPrice: it.unitPrice }))
      : [emptyItem()]
  )
  const [saving, setSaving] = useState(false)

  const productOptions = products.map(p => ({ value: String(p.id), label: `${p.productCode} - ${p.productName}` }))
  const productById = (id) => products.find(p => String(p.id) === String(id))

  const updateItem = (index, field, value) => {
    setItems(list => list.map((it, i) => {
      if (i !== index) return it
      const next = { ...it, [field]: value }
      if (field === 'productId') {
        const p = productById(value)
        next.unitPrice = p?.price ?? 0
      }
      return next
    }))
  }

  const addRow = () => setItems(list => [...list, emptyItem()])
  const removeRow = (index) => setItems(list => list.length > 1 ? list.filter((_, i) => i !== index) : list)

  const grandTotal = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!customerName.trim()) { toast.error('Vui lòng nhập tên khách hàng.'); return }
    const validItems = items.filter(it => it.productId && Number(it.quantity) > 0)
    if (validItems.length === 0) { toast.error('Vui lòng thêm ít nhất 1 sản phẩm.'); return }

    setSaving(true)
    try {
      const user = currentUser()
      const payload = {
        customerName: customerName.trim(),
        invoiceDate,
        preparedByName: user?.fullName || user?.username || '',
        items: validItems.map(it => ({
          productId: +it.productId,
          quantity: +it.quantity,
          unitPrice: +it.unitPrice,
        })),
      }
      if (isEdit) {
        await salesInvoiceService.update(invoice.id, payload)
        toast.success('Cập nhật phiếu bán hàng thành công!')
      } else {
        await salesInvoiceService.create(payload)
        toast.success('Tạo phiếu bán hàng thành công!')
      }
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="invoice-modal" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div className="invoice-modal-header">
            <div className="invoice-modal-top">
              <div>
                <span className="tag chip-rotate invoice-modal-eyebrow">Đức Lợi</span>
                <h3 className="invoice-modal-title">{isEdit ? 'Sửa phiếu bán hàng' : 'Phiếu bán hàng'}</h3>
              </div>
              <button type="button" className="invoice-modal-close" onClick={onClose}>✕</button>
            </div>

            <div className="invoice-modal-fields">
              <label className="form-field">
                <span>Tên khách hàng <span className="required">*</span></span>
                <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Nhập tên khách hàng..." autoFocus required />
              </label>
              <label className="form-field">
                <span>Ngày</span>
                <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </label>
            </div>
            <div className="hzd" />
          </div>

          <div className="invoice-modal-body">
            <table className="invoice-items-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th><th>ĐVT</th><th>SL</th><th>Đơn giá</th><th style={{ textAlign: 'right' }}>Thành tiền</th><th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, i) => {
                  const product = productById(it.productId)
                  const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                  return (
                    <tr key={i}>
                      <td style={{ minWidth: 220 }}>
                        <SearchableSelect
                          value={it.productId}
                          onChange={(val) => updateItem(i, 'productId', val)}
                          options={productOptions}
                          placeholder="-- Chọn sản phẩm --"
                          searchPlaceholder="Tìm theo tên hoặc mã..."
                        />
                      </td>
                      <td className="invoice-col-unit">{product?.unitTypeName || product?.unit || '-'}</td>
                      <td style={{ width: 84 }}>
                        <input type="number" min="1" value={it.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)} />
                      </td>
                      <td style={{ width: 130 }}>
                        <input type="number" min="0" value={it.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
                      </td>
                      <td className="invoice-line-total">{lineTotal.toLocaleString('vi-VN')}đ</td>
                      <td>
                        <button type="button" className="btn-danger-sm" onClick={() => removeRow(i)} disabled={items.length === 1}>Xóa</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <button type="button" className="btn-ghost invoice-add-row" onClick={addRow}>+ Thêm dòng</button>

            <div className="invoice-total-strip">
              <span className="invoice-total-label">Tổng cộng</span>
              <span className="invoice-total-value">{grandTotal.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          <div className="invoice-modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Lưu phiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ExportPanel({ products, invoices, reload }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [modalInvoice, setModalInvoice] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.customerName?.toLowerCase().includes(search.trim().toLowerCase())
    const invDate = inv.invoiceDate.slice(0, 10)
    const matchFrom = !fromDate || invDate >= fromDate
    const matchTo = !toDate || invDate <= toDate
    const matchMonth = !filterMonth || invDate.slice(0, 7) === filterMonth
    return matchSearch && matchFrom && matchTo && matchMonth
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSaved = () => {
    setShowModal(false)
    setModalInvoice(null)
    setPage(1)
    reload()
  }

  const openCreate = () => { setModalInvoice(null); setShowModal(true) }

  const openEdit = async (inv) => {
    setLoadingInvoiceId(inv.id)
    try {
      const full = await salesInvoiceService.getById(inv.id)
      setModalInvoice(full)
      setShowModal(true)
    } catch (err) {
      toast.error(err.message || 'Không tải được phiếu.')
    }
    setLoadingInvoiceId(null)
  }

  const handleDelete = async () => {
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    setDeleting(true)
    try {
      await salesInvoiceService.remove(id)
      toast.success('Đã xóa phiếu bán hàng!')
      setSelectedIds(list => list.filter(x => x !== id))
      reload()
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại.')
    }
    setDeleting(false)
  }

  const toggleSelect = (id) => {
    setSelectedIds(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id])
  }

  const pageIds = paginated.map(inv => inv.id)
  const allPageSelected = pageIds.length > 0 && pageIds.every(id => selectedIds.includes(id))
  const toggleSelectAllOnPage = () => {
    setSelectedIds(list => allPageSelected
      ? list.filter(id => !pageIds.includes(id))
      : [...new Set([...list, ...pageIds])])
  }

  const handleBulkDownload = async () => {
    // Validate: all selected invoices must have the same customer name
    const selectedInvoices = invoices.filter(inv => selectedIds.includes(inv.id))
    const uniqueCustomerNames = [...new Set(selectedInvoices.map(inv => inv.customerName?.trim()))]
    if (uniqueCustomerNames.length > 1) {
      toast.error(
        `Không thể xuất file: Các phiếu được chọn có tên khách hàng khác nhau (${uniqueCustomerNames.join(', ')}). Vui lòng chỉ chọn các phiếu có cùng tên khách hàng.`,
        { duration: 5000 }
      )
      return
    }

    setDownloading(true)
    try {
      const user = currentUser()
      const customerName = uniqueCustomerNames[0] || 'KhachHang'
      await salesInvoiceService.downloadBulkExport(selectedIds, user?.fullName || user?.username || '', customerName)
    } catch (err) {
      toast.error(err.message || 'Tải file thất bại.')
    }
    setDownloading(false)
  }

  return (
    <div>
      <div className="list-header">
        <h4>
          Lịch sử phiếu bán hàng
          <span className="count-badge" style={{ marginLeft: 8 }}>{filtered.length}</span>
        </h4>
        <div style={{ display: 'flex', gap: 8 }}>
          {selectedIds.length > 0 && (
            <button className="btn-edit-sm" onClick={handleBulkDownload} disabled={downloading}>
              {downloading ? 'Đang tải...' : `Tải Excel (${selectedIds.length})`}
            </button>
          )}
          <button className="btn-primary" onClick={openCreate}>+ Thêm phiếu</button>
        </div>
      </div>

      <div className="admin-filter-bar">
        <input
          className="search-input"
          placeholder="Tìm theo tên khách hàng..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        <label className="admin-filter-date">
          <span>Tháng</span>
          <input type="month" value={filterMonth} onChange={e => { setFilterMonth(e.target.value); setPage(1) }} />
        </label>
        <label className="admin-filter-date">
          <span>Từ ngày</span>
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }} />
        </label>
        <label className="admin-filter-date">
          <span>Đến ngày</span>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }} />
        </label>
        {(search || filterMonth || fromDate || toDate) && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => { setSearch(''); setFilterMonth(''); setFromDate(''); setToDate(''); setPage(1) }}
          >Xóa lọc</button>
        )}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAllOnPage} />
              </th>
              <th>#</th><th>Khách hàng</th><th>Ngày</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((inv, i) => (
              <tr key={inv.id}>
                <td>
                  <input type="checkbox" checked={selectedIds.includes(inv.id)} onChange={() => toggleSelect(inv.id)} />
                </td>
                <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                <td><strong>{inv.customerName}</strong></td>
                <td>{new Date(inv.invoiceDate).toLocaleDateString('vi-VN')}</td>
                <td>{inv.itemCount}</td>
                <td className="tag"><strong>{inv.total?.toLocaleString('vi-VN')}đ</strong></td>
                <td>
                  <div className="action-btns">
                    <button className="btn-edit-sm" onClick={() => openEdit(inv)} disabled={loadingInvoiceId === inv.id}>
                      {loadingInvoiceId === inv.id ? '...' : 'Sửa'}
                    </button>
                    <button className="btn-danger-sm" onClick={() => setConfirmDeleteId(inv.id)} disabled={deleting}>
                      Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 24 }}>
                  {invoices.length === 0 ? 'Chưa có phiếu bán hàng nào — bấm "+ Thêm phiếu" để tạo phiếu đầu tiên' : 'Không tìm thấy phiếu phù hợp'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page} totalPages={totalPages} total={filtered.length} pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        label="phiếu" onPage={setPage}
      />

      {showModal && (
        <CreateInvoiceModal
          products={products}
          invoice={modalInvoice}
          onClose={() => { setShowModal(false); setModalInvoice(null) }}
          onSaved={handleSaved}
        />
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa phiếu bán hàng này không? Tồn kho các sản phẩm liên quan sẽ được hoàn lại."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  )
}

function StockManager({ products }) {
  const [sub, setSub] = useState('import')
  const [transactions, setTransactions] = useState([])
  const [invoices, setInvoices] = useState([])

  const loadTransactions = () => stockService.getAll().then(setTransactions).catch(() => {})
  const loadInvoices = () => salesInvoiceService.getAll().then(setInvoices).catch(() => {})
  useEffect(() => { loadTransactions(); loadInvoices() }, [])

  const importTransactions = transactions.filter(t => t.type === 'Import')

  const subTabs = [
    { key: 'import', label: '📥 Nhập kho', count: importTransactions.length },
    { key: 'export', label: '📤 Xuất kho', count: invoices.length },
  ]

  return (
    <div>
      <h3 className="tab-title">Quản lý nhập / xuất kho</h3>

      <div className="sub-tabs">
        {subTabs.map(t => (
          <button
            key={t.key}
            className={`sub-tab-btn ${sub === t.key ? 'active' : ''}`}
            onClick={() => setSub(t.key)}
          >
            {t.label}
            <span className="sub-tab-count">{t.count}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        {sub === 'import'
          ? <ImportPanel products={products} transactions={importTransactions} reload={loadTransactions} />
          : <ExportPanel products={products} invoices={invoices} reload={loadInvoices} />}
      </div>
    </div>
  )
}

export default StockManager
