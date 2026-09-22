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

const EMPTY_IMPORT_FORM = { productId: '', quantity: '', unitPrice: '', note: '' }
const today = () => new Date().toISOString().slice(0, 10)
const emptyItem = () => ({ productId: '', quantity: 1, unitPrice: 0 })

/**
 * Component ImportModal
 */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/70">
          <h3 className="text-lg font-bold text-stone-900">{isEdit ? 'Sửa phiếu nhập kho' : 'Tạo phiếu nhập kho'}</h3>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
              Sản phẩm <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={form.productId}
              onChange={set('productId')}
              required
              autoFocus
            >
              <option value="">-- Chọn sản phẩm --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.productCode} - {p.productName}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                Số lượng <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                value={form.quantity}
                onChange={set('quantity')}
                required
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
                Đơn giá (VNĐ) <span className="text-red-500">*</span>
              </label>
              <MoneyInput
                value={form.unitPrice}
                onChange={set('unitPrice')}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1.5">
              Ghi chú
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              value={form.note}
              onChange={set('note')}
              placeholder="Nhà cung cấp, hóa đơn đi kèm..."
            />
          </div>

          <div className="pt-4 border-t border-stone-200/80 flex justify-end gap-2.5">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {loading ? 'Đang xử lý...' : isEdit ? 'Lưu thay đổi' : 'Xác nhận nhập kho'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Component StockImportPreviewModal
 */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-200/80 flex items-center justify-between bg-stone-50/70 shrink-0">
          <h3 className="text-lg font-bold text-stone-900">Xem trước dữ liệu nhập kho</h3>
          <button
            className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        <div className="p-4 sm:p-6 pb-2 shrink-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-stone-700">Tổng <strong>{result.total}</strong> dòng</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Hợp lệ: {result.validCount}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
              Lỗi: {result.invalidCount}
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-2">
            Mỗi dòng hợp lệ sẽ tạo 1 phiếu nhập kho và cộng thêm số lượng vào tồn kho sản phẩm tương ứng.
          </p>
        </div>

        <div className="flex-1 overflow-auto mx-4 sm:mx-6 rounded-xl border border-stone-200/80 shadow-2xs">
          <table className="w-full text-left text-xs sm:text-sm text-stone-700 border-collapse">
            <thead className="bg-stone-50/90 sticky top-0 z-10 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-2.5 px-3 w-10 text-center"></th>
                <th className="py-2.5 px-3 w-14">Dòng</th>
                <th className="py-2.5 px-3 w-28">Mã SP</th>
                <th className="py-2.5 px-3">Tên sản phẩm</th>
                <th className="py-2.5 px-3 text-right w-16">SL</th>
                <th className="py-2.5 px-3 text-right">Đơn giá</th>
                <th className="py-2.5 px-3">Ghi chú</th>
                <th className="py-2.5 px-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {result.rows.map(r => (
                <tr key={r.rowNumber} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-2 px-3 text-center">
                    <input
                      type="checkbox"
                      className="rounded text-primary focus:ring-primary"
                      checked={selected.has(r.rowNumber)}
                      disabled={r.status === 'Invalid'}
                      onChange={() => toggle(r.rowNumber)}
                    />
                  </td>
                  <td className="py-2 px-3 text-stone-400 font-mono text-xs">{r.rowNumber}</td>
                  <td className="py-2 px-3 font-mono text-xs text-stone-600"><code>{r.productCode || '-'}</code></td>
                  <td className="py-2 px-3 font-medium text-stone-900">{r.productName || '-'}</td>
                  <td className="py-2 px-3 text-right font-semibold text-stone-800">{r.quantity}</td>
                  <td className="py-2 px-3 text-right font-mono text-stone-700">{r.unitPrice?.toLocaleString('vi-VN')}đ</td>
                  <td className="py-2 px-3 text-xs text-stone-500">{r.note || '-'}</td>
                  <td className="py-2 px-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      r.status === 'Invalid'
                        ? 'bg-red-50 text-red-700 border border-red-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {IMPORT_STATUS_LABEL[r.status] || r.status}
                    </span>
                    {r.message && <div className="text-[11px] text-red-600 mt-0.5">{r.message}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-stone-200/80 bg-stone-50/50 flex justify-end gap-2.5 shrink-0 mt-4">
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs transition-colors disabled:opacity-50"
            onClick={handleCommit}
            disabled={committing || selected.size === 0}
          >
            {committing ? 'Đang nhập...' : `Xác nhận nhập kho ${selected.size} dòng`}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Component ImportPanel
 */
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

  const sorted = [...transactions].sort((a, b) => new Date(b.transactionDate || b.createdAt || 0) - new Date(a.transactionDate || a.createdAt || 0) || (b.id || 0) - (a.id || 0))
  const filtered = sorted.filter(t => {
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
    <div className="space-y-3">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-base sm:text-lg font-bold text-stone-800 flex items-center gap-2">
          Lịch sử nhập kho
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
            {filtered.length}
          </span>
        </h4>
        <div className="flex items-center gap-2.5 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleImportFileChange}
            className="hidden"
          />
          <button
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs transition-colors"
            onClick={openAdd}
          >
            <Icon name="plus" size={16} /> Thêm phiếu nhập
          </button>
          <OverflowMenu
            label="Thao tác Excel"
            items={[
              { label: <span className="flex items-center gap-2"><Icon name="importBox" size={16} /> Tải file mẫu</span>, onClick: handleDownloadTemplate },
              { label: uploading ? 'Đang đọc...' : <span className="flex items-center gap-2"><Icon name="file" size={16} /> Nhập Excel</span>, onClick: () => fileInputRef.current?.click(), disabled: uploading },
            ]}
          />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
            <Icon name="search" size={16} />
          </span>
          <input
            className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Tìm theo sản phẩm..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
            showAdvanced
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
          onClick={() => setShowAdvanced(v => !v)}
        >
          <Icon name="chevronDown" size={14} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
          <span>Nâng cao</span>
          {advancedCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
              {advancedCount}
            </span>
          )}
        </button>

        {hasFilters && (
          <button
            type="button"
            className="text-xs font-semibold text-stone-500 hover:text-stone-800 px-2 py-1 transition-colors"
            onClick={clearFilters}
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Advanced Filter Panel */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-4 p-4 bg-stone-50/80 rounded-2xl border border-stone-200 animate-in fade-in duration-150">
          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
            <span>Từ ngày:</span>
            <input
              type="date"
              className="px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1) }}
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-semibold text-stone-600">
            <span>Đến ngày:</span>
            <input
              type="date"
              className="px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1) }}
            />
          </label>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-stone-700 border-collapse">
          <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-xs uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Ngày</th>
              <th className="py-2.5 px-3">Sản phẩm</th>
              <th className="py-2.5 px-3 text-right w-16">SL</th>
              <th className="py-2.5 px-3 text-right">Đơn giá</th>
              <th className="py-2.5 px-3 text-right">Thành tiền</th>
              <th className="py-2.5 px-3">Ghi chú</th>
              <th className="py-2.5 px-3 text-right w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paginated.map((t, i) => (
              <tr key={t.id} className="hover:bg-stone-50/70 transition-colors">
                <td className="py-2 px-3 text-center text-stone-400 font-mono text-xs">{(page - 1) * pageSize + i + 1}</td>
                <td className="py-2 px-3 text-stone-600 whitespace-nowrap">{new Date(t.transactionDate).toLocaleDateString('vi-VN')}</td>
                <td className="py-2 px-3 font-semibold text-stone-900">{t.productName}</td>
                <td className="py-2 px-3 text-right font-semibold text-stone-800">{t.quantity}</td>
                <td className="py-2 px-3 text-right font-mono text-stone-700">{t.unitPrice?.toLocaleString('vi-VN')}đ</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-primary">{(t.quantity * t.unitPrice)?.toLocaleString('vi-VN')}đ</td>
                <td className="py-2 px-3 text-stone-500 text-xs max-w-[200px] truncate">{t.note || '-'}</td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60 transition-colors"
                      onClick={() => openEdit(t)}
                    >
                      <Icon name="edit" size={13} /> Sửa
                    </button>
                    <button
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60 transition-colors"
                      onClick={() => setConfirmDeleteId(t.id)}
                      disabled={deleting}
                    >
                      <Icon name="trash" size={13} /> Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-stone-400 py-12">
                  {transactions.length === 0 ? 'Chưa có giao dịch nhập kho nào' : 'Không tìm thấy giao dịch phù hợp'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page} totalPages={totalPages} total={filtered.length} pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        label="giao dịch" onPage={setPage}
      />

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

/**
 * Component CreateInvoiceModal
 */
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-stone-200/80 bg-stone-50/70 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-primary text-white tracking-wider uppercase">Lý Sáu</span>
                <h3 className="text-lg font-bold text-stone-900">{isEdit ? 'Sửa phiếu bán hàng' : 'Tạo phiếu bán hàng'}</h3>
              </div>
              <button
                type="button"
                className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/70 transition-colors"
                onClick={onClose}
                aria-label="Đóng"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Khách hàng <span className="text-red-500">*</span>
                </label>
                <SearchableSelect
                  value={customerId}
                  onChange={(val) => setCustomerId(val)}
                  options={customerOptions}
                  placeholder="-- Chọn khách hàng --"
                  searchPlaceholder="Tìm theo tên khách hàng..."
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-600 uppercase tracking-wider mb-1">
                  Ngày lập
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  value={invoiceDate}
                  onChange={e => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Items Body */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-4">
            {/* Desktop Items Table */}
            <div className="hidden sm:block overflow-hidden rounded-xl border border-stone-200/80 shadow-2xs">
              <table className="w-full text-left text-xs sm:text-sm text-stone-700 border-collapse">
                <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[220px]">Sản phẩm</th>
                    <th className="py-2.5 px-3 w-20">ĐVT</th>
                    <th className="py-2.5 px-3 w-24">SL</th>
                    <th className="py-2.5 px-3 w-36">Đơn giá</th>
                    <th className="py-2.5 px-3 text-right w-36">Thành tiền</th>
                    <th className="py-2.5 px-3 w-14"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {items.map((it, i) => {
                    const product = productById(it.productId)
                    const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                    return (
                      <tr key={i} className="hover:bg-stone-50/50">
                        <td className="py-2 px-3">
                          <SearchableSelect
                            value={it.productId}
                            onChange={(val) => updateItem(i, 'productId', val)}
                            options={productOptions}
                            placeholder="-- Chọn sản phẩm --"
                            searchPlaceholder="Tìm theo tên hoặc mã..."
                          />
                        </td>
                        <td className="py-2 px-3 text-stone-600">{product?.unitTypeName || product?.unit || '-'}</td>
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            min="1"
                            className="w-full px-2 py-1.5 text-xs bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary"
                            value={it.quantity}
                            onChange={e => updateItem(i, 'quantity', e.target.value)}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <MoneyInput
                            min="0"
                            value={it.unitPrice}
                            onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-stone-900">
                          {lineTotal.toLocaleString('vi-VN')}đ
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            className="text-stone-400 hover:text-red-600 p-1 transition-colors disabled:opacity-30"
                            onClick={() => removeRow(i)}
                            disabled={items.length === 1}
                            title="Xóa dòng"
                          >
                            <Icon name="trash" size={15} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Item Cards */}
            <div className="sm:hidden space-y-3">
              {items.map((it, i) => {
                const product = productById(it.productId)
                const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                return (
                  <div key={i} className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-700">Sản phẩm #{i + 1}</span>
                      <button
                        type="button"
                        className="text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-30"
                        onClick={() => removeRow(i)}
                        disabled={items.length === 1}
                      >
                        Xóa
                      </button>
                    </div>

                    <div>
                      <SearchableSelect
                        value={it.productId}
                        onChange={(val) => updateItem(i, 'productId', val)}
                        options={productOptions}
                        placeholder="-- Chọn sản phẩm --"
                        searchPlaceholder="Tìm theo tên hoặc mã..."
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-500 mb-1">
                          Số lượng {product?.unitTypeName || product?.unit ? `(${product.unitTypeName || product.unit})` : ''}
                        </label>
                        <input
                          type="number"
                          min="1"
                          className="w-full px-2.5 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
                          value={it.quantity}
                          onChange={e => updateItem(i, 'quantity', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-500 mb-1">Đơn giá</label>
                        <MoneyInput
                          min="0"
                          value={it.unitPrice}
                          onChange={e => updateItem(i, 'unitPrice', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-stone-200 text-xs">
                      <span className="text-stone-500">Thành tiền:</span>
                      <strong className="font-mono text-primary font-bold">{lineTotal.toLocaleString('vi-VN')}đ</strong>
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary hover:text-primary/80 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors"
              onClick={addRow}
            >
              <Icon name="plus" size={15} /> Thêm dòng sản phẩm
            </button>

            {/* Total Strip */}
            <div className="flex justify-between items-center p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-sm font-semibold text-stone-700">Tổng cộng thanh toán:</span>
              <span className="text-lg font-bold font-mono text-primary">{grandTotal.toLocaleString('vi-VN')}đ</span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-stone-200/80 bg-stone-50/50 flex justify-end gap-2.5 shrink-0">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Lưu phiếu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Component ExportPanel
 */
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

  const sorted = [...invoices].sort((a, b) => new Date(b.invoiceDate || b.createdAt || 0) - new Date(a.invoiceDate || a.createdAt || 0) || (b.id || 0) - (a.id || 0))
  const filtered = sorted.filter(inv => {
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

  const advancedCount = [filterCustomerId.length > 0, filterMonth, fromDate, toDate, filterSource].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="text-base sm:text-lg font-bold text-stone-800 flex items-center gap-2">
          Lịch sử phiếu bán hàng
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
            {filtered.length}
          </span>
        </h4>
        <div className="flex items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-colors"
              onClick={handleBulkDownload}
              disabled={downloading}
            >
              <Icon name="exportBox" size={14} /> {downloading ? 'Đang tải...' : `Tải Excel (${selectedIds.length})`}
            </button>
          )}
          <button
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-xs transition-colors"
            onClick={openCreate}
          >
            <Icon name="plus" size={16} /> Thêm phiếu
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none">
            <Icon name="search" size={16} />
          </span>
          <input
            className="w-full pl-9 pr-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            placeholder="Tìm theo tên khách hàng..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <button
          type="button"
          className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors ${
            showAdvanced
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
          }`}
          onClick={() => setShowAdvanced(v => !v)}
        >
          <Icon name="chevronDown" size={14} className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
          <span>Nâng cao</span>
          {advancedCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-primary text-white text-xs font-semibold flex items-center justify-center">
              {advancedCount}
            </span>
          )}
        </button>

        {(search || filterCustomerId.length > 0 || filterMonth || fromDate || toDate || filterSource) && (
          <button
            type="button"
            className="text-xs font-semibold text-stone-500 hover:text-stone-800 px-2 py-1 transition-colors"
            onClick={() => { setSearch(''); setFilterCustomerId([]); setFilterMonth(''); setFromDate(''); setToDate(''); setFilterSource(''); setPage(1) }}
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Advanced Filter Panel */}
      {showAdvanced && (
        <div className="flex flex-wrap items-center gap-3 p-4 bg-stone-50/80 rounded-2xl border border-stone-200 animate-in fade-in duration-150">
          <div className="min-w-[240px] flex-1">
            <MultiSearchableSelect
              values={filterCustomerId}
              onChange={(vals) => { setFilterCustomerId(vals); setPage(1) }}
              options={customerFilterOptions}
              placeholder="-- Tất cả khách hàng --"
              searchPlaceholder="Tìm theo tên khách hàng..."
            />
          </div>
          <select
            className="px-3 py-2 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary min-w-[140px]"
            value={filterSource}
            onChange={e => { setFilterSource(e.target.value); setPage(1) }}
          >
            <option value="">-- Tất cả nguồn --</option>
            <option value="online">Online</option>
            <option value="manual">Thủ công</option>
          </select>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
            <span>Tháng:</span>
            <input
              type="month"
              className="px-2 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setPage(1) }}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
            <span>Từ ngày:</span>
            <input
              type="date"
              className="px-2 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
              value={fromDate}
              onChange={e => { setFromDate(e.target.value); setPage(1) }}
            />
          </label>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-stone-600">
            <span>Đến ngày:</span>
            <input
              type="date"
              className="px-2 py-1.5 text-xs bg-white border border-stone-300 rounded-lg"
              value={toDate}
              onChange={e => { setToDate(e.target.value); setPage(1) }}
            />
          </label>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-stone-700 border-collapse">
          <thead className="bg-stone-50 text-stone-600 font-semibold border-b border-stone-200 text-xs uppercase tracking-wider">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">
                <input
                  type="checkbox"
                  className="rounded text-primary focus:ring-primary"
                  checked={allPageSelected}
                  onChange={toggleSelectAllOnPage}
                />
              </th>
              <th className="py-2.5 px-3 w-10 text-center">#</th>
              <th className="py-2.5 px-3">Khách hàng</th>
              <th className="py-2.5 px-3">Nguồn</th>
              <th className="py-2.5 px-3">Ngày lập</th>
              <th className="py-2.5 px-3 text-center w-20">Sản phẩm</th>
              <th className="py-2.5 px-3 text-right">Tổng tiền</th>
              <th className="py-2.5 px-3 text-right w-28">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paginated.map((inv, i) => (
              <tr key={inv.id} className="hover:bg-stone-50/70 transition-colors">
                <td className="py-2 px-3 text-center">
                  <input
                    type="checkbox"
                    className="rounded text-primary focus:ring-primary"
                    checked={selectedIds.includes(inv.id)}
                    onChange={() => toggleSelect(inv.id)}
                  />
                </td>
                <td className="py-2 px-3 text-center text-stone-400 font-mono text-xs">{(page - 1) * pageSize + i + 1}</td>
                <td className="py-2 px-3 font-semibold text-stone-900">{inv.customerName}</td>
                <td className="py-2 px-3">
                  {inv.fromOrderId ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200/60">
                      <Icon name="cart" size={13} /> Đơn #{inv.fromOrderId}
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-stone-100 text-stone-600">
                      Thủ công
                    </span>
                  )}
                </td>
                <td className="py-2 px-3 text-stone-600 whitespace-nowrap">{new Date(inv.invoiceDate).toLocaleDateString('vi-VN')}</td>
                <td className="py-2 px-3 text-center font-medium text-stone-800">{inv.itemCount}</td>
                <td className="py-2 px-3 text-right font-mono font-bold text-primary">{inv.total?.toLocaleString('vi-VN')}đ</td>
                <td className="py-2 px-3 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60 transition-colors disabled:opacity-50"
                      onClick={() => openEdit(inv)}
                      disabled={loadingInvoiceId === inv.id}
                    >
                      <Icon name="edit" size={13} /> {loadingInvoiceId === inv.id ? '...' : 'Sửa'}
                    </button>
                    <button
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/60 transition-colors disabled:opacity-50"
                      onClick={() => setConfirmDeleteId(inv.id)}
                      disabled={deleting}
                    >
                      <Icon name="trash" size={13} /> Xóa
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center text-stone-400 py-12">
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

/**
 * Component quản lý giao dịch xuất nhập tồn kho
 */
function StockManager({ products, onChanged }) {
  const [sub, setSub] = useState('import')
  const [transactions, setTransactions] = useState([])
  const [invoices, setInvoices] = useState([])
  const [customers, setCustomers] = useState([])

  const loadTransactions = () => stockService.getAll().then(data => {
    const list = Array.isArray(data) ? data : []
    list.sort((a, b) => new Date(b.transactionDate || b.createdAt || 0) - new Date(a.transactionDate || a.createdAt || 0) || (b.id || 0) - (a.id || 0))
    setTransactions(list)
  }).catch(() => {})

  const loadInvoices = () => salesInvoiceService.getAll().then(data => {
    const list = Array.isArray(data) ? data : []
    list.sort((a, b) => new Date(b.invoiceDate || b.createdAt || 0) - new Date(a.invoiceDate || a.createdAt || 0) || (b.id || 0) - (a.id || 0))
    setInvoices(list)
  }).catch(() => {})

  const loadCustomers = () => customerService.getAll().then(setCustomers).catch(() => {})
  useEffect(() => { loadTransactions(); loadInvoices(); loadCustomers() }, [])

  const importTransactions = transactions.filter(t => t.type === 'Import')

  const subTabs = [
    { key: 'import', label: <><Icon name="importBox" size={16} /> Nhập kho</>, count: importTransactions.length },
    { key: 'export', label: <><Icon name="exportBox" size={16} /> Xuất kho</>, count: invoices.length },
  ]

  return (
    <div className="space-y-3">
      <h3 className="text-lg sm:text-xl font-bold text-stone-800">Quản lý nhập / xuất kho</h3>

      {/* Pill tabs */}
      <div className="inline-flex p-1 bg-white rounded-2xl border border-stone-200/80 shadow-2xs gap-1">
        {subTabs.map(t => (
          <button
            key={t.key}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              sub === t.key
                ? 'bg-primary text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
            onClick={() => setSub(t.key)}
          >
            {t.label}
            <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs ${
              sub === t.key
                ? 'bg-white/20 text-white'
                : 'bg-stone-100 text-stone-600'
            }`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <div>
        {sub === 'import'
          ? <ImportPanel products={products} transactions={importTransactions} reload={loadTransactions} onChanged={onChanged} />
          : <ExportPanel products={products} customers={customers} invoices={invoices} reload={loadInvoices} onChanged={onChanged} />}
      </div>
    </div>
  )
}

export default StockManager
