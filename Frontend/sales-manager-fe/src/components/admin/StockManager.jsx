import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { stockService } from '../../services/stockService'
import { salesInvoiceService } from '../../services/salesInvoiceService'
import { customerService } from '../../services/customerService'
import Pagination from '../common/Pagination'
import SearchableSelect from '../common/SearchableSelect'
import MultiSearchableSelect from '../common/MultiSearchableSelect'
import ConfirmModal from '../common/ConfirmModal'
import MoneyInput from '../common/MoneyInput'
import OverflowMenu from '../common/OverflowMenu'
import { Icon } from '../common/Icon'

const IMPORT_STATUS_LABEL = { Valid: 'Hợp lệ', Invalid: 'Lỗi' }
const IMPORT_STATUS_CLASS = { Valid: 'new', Invalid: 'invalid' }

const EMPTY_IMPORT_FORM = { productId: '', quantity: '', unitPrice: '', note: '' }
const today = () => new Date().toISOString().slice(0, 10)
const emptyItem = () => ({ productId: '', quantity: 1, unitPrice: 0 })
function ImportModal({ products, transaction, onClose, onSaved }) {
  const isEdit = !!transaction
  const [form, setForm] = useState(isEdit ? {
    productId: String(transaction.productId),
    quantity: transaction.quantity,
    unitPrice: transaction.unitPrice,
    note: transaction.note || '',
  } : EMPTY_IMPORT_FORM)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const payload = {
      ...form,
      type: 'Import',
      productId: +form.productId,
      quantity: +form.quantity,
      unitPrice: +form.unitPrice,
    }
    try {
      if (isEdit) {
        await stockService.update(transaction.id, payload)
        toast.success('Cập nhật phiếu nhập kho thành công!')
      } else {
        await stockService.create(payload)
        toast.success('Nhập kho thành công!')
      }
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Sửa phiếu nhập kho' : 'Tạo phiếu nhập kho'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="add-product-form">
          <label className="form-field">
            <span>Sản phẩm <span className="required">*</span></span>
            <select value={form.productId} onChange={set('productId')} required autoFocus>
              <option value="">-- Chọn sản phẩm --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.productCode} - {p.productName}</option>
              ))}
            </select>
          </label>

          <div className="form-row">
            <label className="form-field">
              <span>Số lượng <span className="required">*</span></span>
              <input type="number" value={form.quantity} onChange={set('quantity')} required min="1" />
            </label>
            <label className="form-field">
              <span>Đơn giá (VNĐ) <span className="required">*</span></span>
              <MoneyInput value={form.unitPrice} onChange={set('unitPrice')} required />
            </label>
          </div>

          <label className="form-field">
            <span>Ghi chú</span>
            <input type="text" value={form.note} onChange={set('note')} placeholder="Nhà cung cấp..." />
          </label>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : isEdit ? 'Lưu thay đổi' : 'Xác nhận nhập kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function StockImportPreviewModal({ result, onClose, onImported }) {
  const [selected, setSelected] = useState(() => new Set(
    result.rows.filter(r => r.status !== 'Invalid').map(r => r.rowNumber)
  ))
  const [committing, setCommitting] = useState(false)

  const toggle = (rowNumber) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(rowNumber) ? next.delete(rowNumber) : next.add(rowNumber)
      return next
    })
  }

  const handleCommit = async () => {
    const rows = result.rows
      .filter(r => selected.has(r.rowNumber) && r.status !== 'Invalid')
      .map(r => ({
        productId: r.productId,
        quantity: r.quantity,
        unitPrice: r.unitPrice,
        note: r.note || null,
      }))
    if (rows.length === 0) { toast.error('Chưa chọn dòng nào để nhập.'); return }
    setCommitting(true)
    try {
      const res = await stockService.commitImport(rows)
      toast.success(res.message || 'Nhập kho thành công!')
      onImported()
    } catch (err) {
      toast.error(err.message || 'Nhập kho thất bại.')
      setCommitting(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box import-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Xem trước dữ liệu nhập kho</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <div style={{ padding: '14px 24px 0' }}>
          <div className="import-summary">
            <span>Tổng <strong>{result.total}</strong> dòng</span>
            <span className="import-status-badge new">Hợp lệ: {result.validCount}</span>
            <span className="import-status-badge invalid">Lỗi: {result.invalidCount}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '8px 0 0' }}>
            Mỗi dòng hợp lệ sẽ tạo 1 phiếu nhập kho và cộng thêm số lượng vào tồn kho sản phẩm tương ứng.
          </p>
        </div>

        <div className="admin-table-wrap" style={{ margin: '14px 24px', maxHeight: 360, overflowY: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Dòng</th><th>Mã SP</th><th>Tên sản phẩm</th>
                <th>SL</th><th>Đơn giá</th><th>Ghi chú</th><th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map(r => (
                <tr key={r.rowNumber}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(r.rowNumber)}
                      disabled={r.status === 'Invalid'}
                      onChange={() => toggle(r.rowNumber)}
                    />
                  </td>
                  <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{r.rowNumber}</td>
                  <td>{r.productCode || '-'}</td>
                  <td>{r.productName || '-'}</td>
                  <td>{r.quantity}</td>
                  <td>{r.unitPrice?.toLocaleString('vi-VN')}đ</td>
                  <td>{r.note || '-'}</td>
                  <td>
                    <span className={`import-status-badge ${IMPORT_STATUS_CLASS[r.status]}`}>{IMPORT_STATUS_LABEL[r.status]}</span>
                    {r.message && <div style={{ fontSize: '0.72rem', color: 'var(--primary)', marginTop: 3 }}>{r.message}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn-primary" onClick={handleCommit} disabled={committing || selected.size === 0}>
            {committing ? 'Đang nhập...' : `Xác nhận nhập kho ${selected.size} dòng`}
          </button>
        </div>
      </div>
    </div>
  )
}

function ImportPanel({ products, transactions, reload, onChanged }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const openAdd = () => { setEditingTransaction(null); setShowModal(true) }
  const openEdit = (t) => { setEditingTransaction(t); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditingTransaction(null) }

  const handleSaved = () => {
    closeModal()
    setPage(1)
    reload()
    onChanged?.()
  }

  const handleDelete = async () => {
    const id = confirmDeleteId
    setConfirmDeleteId(null)
    setDeleting(true)
    try {
      await stockService.remove(id)
      toast.success('Đã xóa giao dịch nhập kho!')
      reload()
      onChanged?.()
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại.')
    }
    setDeleting(false)
  }

  const handleDownloadTemplate = async () => {
    try { await stockService.downloadTemplate() } catch (err) { toast.error(err.message || 'Tải mẫu thất bại.') }
  }

  const handleImportFileChange = async (e) => {
    const file = e.target.files[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return
    setUploading(true)
    try {
      const result = await stockService.previewImport(file)
      setImportResult(result)
    } catch (err) {
      toast.error(err.message || 'Không đọc được file.')
    }
    setUploading(false)
  }

  const handleImported = () => {
    setImportResult(null)
    setPage(1)
    reload()
    onChanged?.()
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
  const advancedCount = [fromDate, toDate].filter(Boolean).length

  const clearFilters = () => { setSearch(''); setFromDate(''); setToDate(''); setPage(1) }

  return (
    <div>
      <div className="list-header">
        <h4>
          Lịch sử nhập kho
          <span className="count-badge" style={{ marginLeft: 8 }}>{filtered.length}</span>
        </h4>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleImportFileChange}
            style={{ display: 'none' }}
          />
          <button className="btn-primary" onClick={openAdd}>+ Thêm phiếu nhập</button>
          <OverflowMenu
            label="Thao tác Excel"
            items={[
              { label: <><Icon name="importBox" /> Tải file mẫu</>, onClick: handleDownloadTemplate },
              { label: uploading ? 'Đang đọc...' : <><Icon name="file" /> Nhập Excel</>, onClick: () => fileInputRef.current?.click(), disabled: uploading },
            ]}
          />
        </div>
      </div>

      <div>
        <div className="admin-filter-bar">
          <input
            className="search-input"
            placeholder="Tìm theo sản phẩm..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
          <button
            type="button"
            className={`btn-advanced-toggle ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(v => !v)}
          >
          <span className="toggle-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span> Nâng cao
            {advancedCount > 0 && <span className="advanced-count">{advancedCount}</span>}
          </button>
          {hasFilters && <button type="button" className="btn-ghost" onClick={clearFilters}>Xóa lọc</button>}
        </div>
        {showAdvanced && (
          <div className="advanced-filter-panel">
            <label className="admin-filter-date">
              <span>Từ ngày</span>
              <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1) }} />
            </label>
            <label className="admin-filter-date">
              <span>Đến ngày</span>
              <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1) }} />
            </label>
          </div>
        )}

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>#</th><th>Ngày</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th><th>Ghi chú</th><th>Thao tác</th>
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
                  <td>
                    <div className="action-btns">
                      <button className="btn-edit-sm" onClick={() => openEdit(t)}><Icon name="edit" /> Sửa</button>
                      <button className="btn-danger-sm" onClick={() => setConfirmDeleteId(t.id)} disabled={deleting}>
                        <Icon name="trash" /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 24 }}>
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
          transaction={editingTransaction}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {confirmDeleteId && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa giao dịch nhập kho này không? Tồn kho sản phẩm liên quan sẽ được điều chỉnh lại."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {importResult && (
        <StockImportPreviewModal
          result={importResult}
          onClose={() => setImportResult(null)}
          onImported={handleImported}
        />
      )}
    </div>
  )
}

function CreateInvoiceModal({ products, customers, invoice, onClose, onSaved }) {
  const isEdit = !!invoice
  const [customerId, setCustomerId] = useState(invoice?.customerId ? String(invoice.customerId) : '')
  const [invoiceDate, setInvoiceDate] = useState(invoice ? invoice.invoiceDate.slice(0, 10) : today())
  const [items, setItems] = useState(
    invoice?.items?.length
      ? invoice.items.map(it => ({ productId: String(it.productId), quantity: it.quantity, unitPrice: it.unitPrice }))
      : [emptyItem()]
  )
  const [saving, setSaving] = useState(false)

  const productOptions = products.map(p => ({ value: String(p.id), label: `${p.productCode} - ${p.productName}` }))
  const productById = (id) => products.find(p => String(p.id) === String(id))
  const customerOptions = customers.map(c => ({ value: String(c.id), label: c.fullName }))

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
    if (!customerId) { toast.error('Vui lòng chọn khách hàng.'); return }
    const validItems = items.filter(it => it.productId && Number(it.quantity) > 0)
    if (validItems.length === 0) { toast.error('Vui lòng thêm ít nhất 1 sản phẩm.'); return }

    setSaving(true)
    try {
      const payload = {
        customerId: +customerId,
        invoiceDate,
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
                <span className="tag chip-rotate invoice-modal-eyebrow">Lý Sáu</span>
                <h3 className="invoice-modal-title">{isEdit ? 'Sửa phiếu bán hàng' : 'Phiếu bán hàng'}</h3>
              </div>
              <button type="button" className="invoice-modal-close" onClick={onClose} aria-label="Đóng">✕</button>
            </div>

            <div className="invoice-modal-fields">
              <div className="form-field">
                <span>Khách hàng <span className="required">*</span></span>
                <SearchableSelect
                  value={customerId}
                  onChange={(val) => setCustomerId(val)}
                  options={customerOptions}
                  placeholder="-- Chọn khách hàng --"
                  searchPlaceholder="Tìm theo tên khách hàng..."
                />
              </div>
              <label className="form-field">
                <span>Ngày</span>
                <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </label>
            </div>
            <div className="hzd" />
          </div>

          <div className="invoice-modal-body">
            <div className="invoice-desktop-items">
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
                          <MoneyInput min="0" value={it.unitPrice} onChange={e => updateItem(i, 'unitPrice', e.target.value)} />
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
            </div>

            <div className="invoice-mobile-items">
              {items.map((it, i) => {
                const product = productById(it.productId)
                const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                return (
                  <div key={i} className="invoice-mobile-card">
                    <div className="invoice-mobile-card-head">
                      <span className="invoice-mobile-card-num">Sản phẩm #{i + 1}</span>
                      <button
                        type="button"
                        className="btn-danger-sm"
                        onClick={() => removeRow(i)}
                        disabled={items.length === 1}
                        aria-label="Xóa sản phẩm"
                      >
                        <Icon name="trash" size={13} /> Xóa
                      </button>
                    </div>

                    <div className="form-field">
                      <span>Sản phẩm <span className="required">*</span></span>
                      <SearchableSelect
                        value={it.productId}
                        onChange={(val) => updateItem(i, 'productId', val)}
                        options={productOptions}
                        placeholder="-- Chọn sản phẩm --"
                        searchPlaceholder="Tìm theo tên hoặc mã..."
                      />
                    </div>

                    <div className="form-row" style={{ marginTop: 10 }}>
                      <label className="form-field">
                        <span>Số lượng {product?.unitTypeName || product?.unit ? `(${product.unitTypeName || product.unit})` : ''} <span className="required">*</span></span>
                        <input
                          type="number"
                          min="1"
                          value={it.quantity}
                          onChange={e => updateItem(i, 'quantity', e.target.value)}
                        />
                      </label>
                      <label className="form-field">
                        <span>Đơn giá (VNĐ) <span className="required">*</span></span>
                        <MoneyInput
                          min="0"
                          value={it.unitPrice}
                          onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                        />
                      </label>
                    </div>

                    <div className="invoice-mobile-card-total">
                      <span>Thành tiền:</span>
                      <strong>{lineTotal.toLocaleString('vi-VN')}đ</strong>
                    </div>
                  </div>
                )
              })}
            </div>

            <button type="button" className="btn-ghost invoice-add-row" onClick={addRow}>
              <Icon name="plus" size={15} /> Thêm dòng sản phẩm
            </button>

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

function ExportPanel({ products, customers, invoices, reload, onChanged }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [filterMonth, setFilterMonth] = useState('')
  const [filterCustomerId, setFilterCustomerId] = useState([])
  const [filterSource, setFilterSource] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [modalInvoice, setModalInvoice] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [loadingInvoiceId, setLoadingInvoiceId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const customerFilterOptions = customers.map(c => ({ value: String(c.id), label: c.fullName }))

  const filtered = invoices.filter(inv => {
    const matchSearch = inv.customerName?.toLowerCase().includes(search.trim().toLowerCase())
    const matchCustomer = filterCustomerId.length === 0 || filterCustomerId.includes(String(inv.customerId))
    const invDate = inv.invoiceDate.slice(0, 10)
    const matchFrom = !fromDate || invDate >= fromDate
    const matchTo = !toDate || invDate <= toDate
    const matchMonth = !filterMonth || invDate.slice(0, 7) === filterMonth
    const matchSource = !filterSource
      || (filterSource === 'online' && !!inv.fromOrderId)
      || (filterSource === 'manual' && !inv.fromOrderId)
    return matchSearch && matchCustomer && matchFrom && matchTo && matchMonth && matchSource
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleSaved = () => {
    setShowModal(false)
    setModalInvoice(null)
    setPage(1)
    reload()
    onChanged?.()
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
      onChanged?.()
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
      const customerName = uniqueCustomerNames[0] || 'KhachHang'
      await salesInvoiceService.downloadBulkExport(selectedIds, customerName)
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
        <button
          type="button"
          className={`btn-advanced-toggle ${showAdvanced ? 'active' : ''}`}
          onClick={() => setShowAdvanced(v => !v)}
        >
          <span className="toggle-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></span> Nâng cao
          {[filterCustomerId.length > 0, filterMonth, fromDate, toDate, filterSource].filter(Boolean).length > 0 && (
            <span className="advanced-count">{[filterCustomerId.length > 0, filterMonth, fromDate, toDate, filterSource].filter(Boolean).length}</span>
          )}
        </button>
        {(search || filterCustomerId.length > 0 || filterMonth || fromDate || toDate || filterSource) && (
          <button
            type="button"
            className="btn-ghost"
            onClick={() => { setSearch(''); setFilterCustomerId([]); setFilterMonth(''); setFromDate(''); setToDate(''); setFilterSource(''); setPage(1) }}
          >Xóa lọc</button>
        )}
      </div>
      {showAdvanced && (
        <div className="advanced-filter-panel">
          <div style={{ minWidth: 260 }}>
            <MultiSearchableSelect
              values={filterCustomerId}
              onChange={(vals) => { setFilterCustomerId(vals); setPage(1) }}
              options={customerFilterOptions}
              placeholder="-- Tất cả khách hàng --"
              searchPlaceholder="Tìm theo tên khách hàng..."
            />
          </div>
          <select
            className="search-input"
            value={filterSource}
            onChange={e => { setFilterSource(e.target.value); setPage(1) }}
            style={{ minWidth: 140, maxWidth: 180 }}
          >
            <option value="">-- Tất cả nguồn --</option>
            <option value="online">Online</option>
            <option value="manual">Thủ công</option>
          </select>
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
        </div>
      )}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input type="checkbox" checked={allPageSelected} onChange={toggleSelectAllOnPage} />
              </th>
              <th>#</th><th>Khách hàng</th><th>Nguồn</th><th>Ngày</th><th>Sản phẩm</th><th>Tổng tiền</th><th>Thao tác</th>
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
                <td>
                  {inv.fromOrderId
                    ? <span className="order-source-badge online"><Icon name="cart" size={14} /> Đơn #{inv.fromOrderId}</span>
                    : <span className="order-source-badge manual">Thủ công</span>}
                </td>
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
                <td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 24 }}>
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
          customers={customers}
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

function StockManager({ products, onChanged }) {
  const [sub, setSub] = useState('import')
  const [transactions, setTransactions] = useState([])
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])

  const loadTransactions = () => stockService.getAll().then(setTransactions).catch(() => {})
  const loadInvoices = () => salesInvoiceService.getAll().then(setInvoices).catch(() => {})
  const loadCustomers = () => customerService.getAll().then(setCustomers).catch(() => {})
  useEffect(() => { loadTransactions(); loadInvoices(); loadCustomers() }, [])

  const importTransactions = transactions.filter(t => t.type === 'Import')

  const subTabs = [
    { key: 'import', label: <><Icon name="importBox" /> Nhập kho</>, count: importTransactions.length },
    { key: 'export', label: <><Icon name="exportBox" /> Xuất kho</>, count: invoices.length },
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
          ? <ImportPanel products={products} transactions={importTransactions} reload={loadTransactions} onChanged={onChanged} />
          : <ExportPanel products={products} customers={customers} invoices={invoices} reload={loadInvoices} onChanged={onChanged} />}
      </div>
    </div>
  )
}

export default StockManager
