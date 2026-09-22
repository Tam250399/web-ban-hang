import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { productService } from '../../services/productService'
import { uploadImage } from '../../services/uploadService'
import Pagination from '../common/Pagination'
import ConfirmModal from '../common/ConfirmModal'
import MoneyInput from '../common/MoneyInput'
import OverflowMenu from '../common/OverflowMenu'
import AddProduct from './AddProduct'
import { resolveMediaUrl } from '../../services/config'
import { Icon } from '../common/Icon'

const IMPORT_STATUS_LABEL = { New: 'Mới', Duplicate: 'Trùng mã', Invalid: 'Lỗi' }
const IMPORT_STATUS_CLASS = { New: 'new', Duplicate: 'duplicate', Invalid: 'invalid' }

/**
 * Component ImportPreviewModal
 */
function ImportPreviewModal({ result, onClose, onImported }) {
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
      .filter(r => selected.has(r.rowNumber))
      .map(r => ({
        productCode: r.productCode,
        productName: r.productName,
        categoryName: r.categoryName || null,
        unitName: r.unitName || null,
        price: r.price,
        stockQuantity: r.stockQuantity,
        description: r.description || null,
        overwrite: r.status === 'Duplicate',
      }))
    if (rows.length === 0) { toast.error('Chưa chọn dòng nào để nhập.'); return }
    setCommitting(true)
    try {
      const res = await productService.commitImport(rows)
      toast.success(res.message || 'Nhập dữ liệu thành công!')
      onImported()
    } catch (err) {
      toast.error(err.message || 'Nhập dữ liệu thất bại.')
      setCommitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <Icon name="file" size={18} className="text-primary" /> Xem trước dữ liệu nhập
          </h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer text-sm font-bold" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <div className="p-6 pb-2 space-y-2">
          <div className="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm">
            <span className="font-medium text-stone-700">Tổng <strong className="text-stone-900">{result.total}</strong> dòng:</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Mới: {result.newCount}</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">Trùng mã: {result.duplicateCount}</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">Lỗi: {result.invalidCount}</span>
          </div>
          <p className="text-xs text-stone-500">
            Dòng "Trùng mã" nếu chọn sẽ <strong className="text-stone-800">ghi đè</strong> sản phẩm hiện có cùng mã. Dòng "Lỗi" không thể chọn.
          </p>
        </div>

        <div className="mx-6 my-3 max-h-80 overflow-y-auto rounded-2xl border border-stone-200/80 shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider sticky top-0">
                <th className="px-3 py-2.5 w-10 text-center"></th>
                <th className="px-3 py-2.5">Dòng</th>
                <th className="px-3 py-2.5">Mã SP</th>
                <th className="px-3 py-2.5">Tên sản phẩm</th>
                <th className="px-3 py-2.5">Danh mục</th>
                <th className="px-3 py-2.5">ĐVT</th>
                <th className="px-3 py-2.5">Giá bán</th>
                <th className="px-3 py-2.5">Tồn kho</th>
                <th className="px-3 py-2.5">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {result.rows.map(r => (
                <tr key={r.rowNumber} className="hover:bg-stone-50/60 transition">
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selected.has(r.rowNumber)}
                      disabled={r.status === 'Invalid'}
                      onChange={() => toggle(r.rowNumber)}
                      className="accent-primary rounded"
                    />
                  </td>
                  <td className="px-3 py-2 text-stone-400">{r.rowNumber}</td>
                  <td className="px-3 py-2 font-mono font-medium">{r.productCode || '-'}</td>
                  <td className="px-3 py-2 font-bold text-stone-900">{r.productName || '-'}</td>
                  <td className="px-3 py-2 text-stone-600">{r.categoryName || '-'}</td>
                  <td className="px-3 py-2 text-stone-600">{r.unitName || '-'}</td>
                  <td className="px-3 py-2 font-medium">{r.price?.toLocaleString('vi-VN')}đ</td>
                  <td className="px-3 py-2">{r.stockQuantity}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      r.status === 'New' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                      r.status === 'Duplicate' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {IMPORT_STATUS_LABEL[r.status]}
                    </span>
                    {r.message && <div className="text-[11px] text-red-600 mt-0.5">{r.message}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-3">
          <button type="button" className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs sm:text-sm transition cursor-pointer" onClick={onClose}>Hủy</button>
          <button
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
            onClick={handleCommit}
            disabled={committing || selected.size === 0}
          >
            {committing ? 'Đang nhập...' : `Xác nhận nhập ${selected.size} sản phẩm`}
          </button>
        </div>
      </div>
    </div>
  )
}

/**
 * Component EditModal
 */
function EditModal({ product, categories, unitTypes, onSave, onClose }) {
  const [form, setForm] = useState({
    productName: product.productName,
    categoryId:  product.categoryId  || '',
    unitTypeId:  product.unitTypeId  || '',
    price:       product.price,
    description: product.description || '',
    imageUrl:    product.imageUrl    || '',
  })
  const [loading, setLoading]       = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [imagePreview, setImagePreview] = useState(product.imageUrl ? resolveMediaUrl(product.imageUrl) : null)
  const fileInputRef = useRef(null)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setForm(f => ({ ...f, imageUrl: url }))
      toast.success('Tải ảnh lên thành công!')
    } catch (err) {
      toast.error(err.message || 'Tải ảnh thất bại.')
      setImagePreview(product.imageUrl ? resolveMediaUrl(product.imageUrl) : null)
    }
    setUploading(false)
  }

  const removeImage = () => {
    setImagePreview(null)
    setForm(f => ({ ...f, imageUrl: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await productService.update(product.id, {
        productCode:   product.productCode,
        productName:   form.productName,
        unit:          '',
        price:         +form.price,
        stockQuantity: product.stockQuantity,
        description:   form.description,
        imageUrl:      form.imageUrl,
        categoryId:    form.categoryId ? +form.categoryId : null,
        unitTypeId:    form.unitTypeId ? +form.unitTypeId : null,
      })
      toast.success('Cập nhật sản phẩm thành công!')
      onSave()
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <Icon name="edit" size={18} className="text-primary" /> Chỉnh sửa sản phẩm
          </h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer text-sm font-bold" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="md:col-span-1 space-y-2">
              <p className="text-xs sm:text-sm font-bold text-stone-700">Hình ảnh</p>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-square max-h-[240px] bg-stone-50 flex items-center justify-center group">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-stone-900/60 text-white flex items-center justify-center text-xs font-bold backdrop-blur-2xs">
                      Đang tải...
                    </div>
                  )}
                  {!uploading && (
                    <button
                      type="button"
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-stone-900/75 hover:bg-stone-900 text-white flex items-center justify-center text-xs font-bold transition shadow-sm cursor-pointer"
                      onClick={removeImage}
                      aria-label="Xoá ảnh"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <label className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition min-h-[200px] ${
                  uploading ? 'border-primary bg-primary/5 opacity-70 pointer-events-none' : 'border-stone-300 hover:border-primary bg-stone-50/50 hover:bg-stone-50'
                }`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="sr-only"
                    disabled={uploading}
                  />
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-stone-200/60 flex items-center justify-center text-stone-400 mb-2">
                    <Icon name="image" size={24} />
                  </div>
                  <span className="text-xs font-bold text-stone-800">{uploading ? 'Đang tải lên...' : 'Nhấn để chọn ảnh'}</span>
                  <span className="text-[11px] text-stone-400 mt-1">JPG, PNG, WEBP · Tối đa 5MB</span>
                </label>
              )}
            </div>

            <div className="md:col-span-2 space-y-3.5">
              <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                <span>Mã sản phẩm</span>
                <input
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 text-xs sm:text-sm cursor-not-allowed font-mono"
                  value={product.productCode}
                  disabled
                />
              </label>

              <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                <span>Tên sản phẩm <span className="text-red-500">*</span></span>
                <input
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  value={form.productName}
                  onChange={set('productName')}
                  required
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                  <span>Danh mục</span>
                  <select
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                    value={form.categoryId}
                    onChange={set('categoryId')}
                  >
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                  <span>Đơn vị tính</span>
                  <select
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                    value={form.unitTypeId}
                    onChange={set('unitTypeId')}
                  >
                    <option value="">-- Chọn đơn vị --</option>
                    {unitTypes.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </label>
              </div>

              <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                <span>Giá bán (VNĐ) <span className="text-red-500">*</span></span>
                <div className="mt-1.5">
                  <MoneyInput value={form.price} onChange={set('price')} required min="0" />
                </div>
              </label>

              <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                <span>Mô tả</span>
                <input
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Mô tả ngắn..."
                />
              </label>
            </div>

          </div>

          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs sm:text-sm transition cursor-pointer" onClick={onClose}>Hủy</button>
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
              disabled={loading || uploading}
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Component quản lý danh sách sản phẩm (tìm kiếm, lọc, sửa, xóa, xuất Excel)
 */
function ProductList({ products, categories, unitTypes, onRefresh }) {
  const [deleting, setDeleting]   = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [editing, setEditing]     = useState(null)
  const [page, setPage]           = useState(1)
  const [pageSize, setPageSize]   = useState(10)
  const [search, setSearch]       = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleDownloadTemplate = async () => {
    try { await productService.downloadTemplate() } catch (err) { toast.error(err.message || 'Tải mẫu thất bại.') }
  }

  const handleExport = async () => {
    try { await productService.exportAll() } catch (err) { toast.error(err.message || 'Xuất file thất bại.') }
  }

  const handleImportFileChange = async (e) => {
    const file = e.target.files[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file) return
    setUploading(true)
    try {
      const result = await productService.previewImport(file)
      setImportResult(result)
    } catch (err) {
      toast.error(err.message || 'Không đọc được file.')
    }
    setUploading(false)
  }

  const handleImported = () => {
    setImportResult(null)
    onRefresh()
  }

  const sorted = [...products].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0))
  const filtered = sorted.filter(p =>
    p.productName?.toLowerCase().includes(search.toLowerCase()) ||
    p.productCode?.toLowerCase().includes(search.toLowerCase()) ||
    (p.categoryName || p.category || '')?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize)

  const handleDelete = async () => {
    const id = confirmId
    setConfirmId(null)
    setDeleting(id)
    try {
      await productService.remove(id)
      toast.success('Đã xóa sản phẩm!')
      onRefresh()
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại.')
    }
    setDeleting(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          Danh sách sản phẩm
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {filtered.length}
          </span>
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleImportFileChange}
            className="sr-only"
          />
          <button
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer shrink-0"
            onClick={() => setShowAddModal(true)}
          >
            <Icon name="plus" size={15} /> Thêm mới
          </button>
          <OverflowMenu
            label="Thao tác Excel"
            items={[
              { label: <span className="inline-flex items-center gap-2"><Icon name="importBox" size={14} /> Tải file mẫu</span>, onClick: handleDownloadTemplate },
              { label: <span className="inline-flex items-center gap-2"><Icon name="exportBox" size={14} /> Xuất Excel</span>, onClick: handleExport },
              { label: uploading ? 'Đang đọc...' : <span className="inline-flex items-center gap-2"><Icon name="file" size={14} /> Nhập Excel</span>, onClick: () => fileInputRef.current?.click(), disabled: uploading },
            ]}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 bg-white p-2.5 sm:p-3 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            placeholder="Tìm theo tên, mã, danh mục..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        {search && (
          <button
            type="button"
            className="px-3 py-1.5 rounded-xl text-stone-500 hover:text-stone-800 hover:bg-stone-100 text-xs font-bold transition cursor-pointer"
            onClick={() => { setSearch(''); setPage(1) }}
          >
            Xóa lọc
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="px-3.5 py-2.5">#</th>
              <th className="px-3.5 py-2.5">Ảnh</th>
              <th className="px-3.5 py-2.5">Mã SP</th>
              <th className="px-3.5 py-2.5">Tên sản phẩm</th>
              <th className="px-3.5 py-2.5">Danh mục</th>
              <th className="px-3.5 py-2.5">Đơn vị</th>
              <th className="px-3.5 py-2.5">Giá bán</th>
              <th className="px-3.5 py-2.5">Tồn kho</th>
              <th className="px-3.5 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paginated.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-12 text-stone-400 text-xs sm:text-sm">
                  {search ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
                </td>
              </tr>
            )}
            {paginated.map((p, i) => (
              <tr key={p.id} className={`transition ${p.stockQuantity < 50 ? 'bg-amber-50/30 hover:bg-amber-50/60' : 'hover:bg-stone-50/60'}`}>
                <td className="px-3.5 py-2 text-stone-400 text-xs">
                  {(page - 1) * pageSize + i + 1}
                </td>
                <td className="px-3.5 py-2">
                  {p.imageUrl ? (
                    <img
                      src={resolveMediaUrl(p.imageUrl)}
                      alt={p.productName}
                      className="w-9 h-9 object-cover rounded-xl border border-stone-200 shadow-2xs"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400">
                      <Icon name="brick" size={18} />
                    </div>
                  )}
                </td>
                <td className="px-3.5 py-2"><code className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 font-mono text-xs">{p.productCode}</code></td>
                <td className="px-3.5 py-2 font-bold text-stone-900">{p.productName}</td>
                <td className="px-3.5 py-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                    {p.categoryName || p.category || 'Khác'}
                  </span>
                </td>
                <td className="px-3.5 py-2 text-stone-600">{p.unitTypeName || p.unit}</td>
                <td className="px-3.5 py-2 font-bold text-primary">{p.price?.toLocaleString('vi-VN')}đ</td>
                <td className="px-3.5 py-2">
                  <span className={`inline-flex items-center gap-1 font-semibold ${p.stockQuantity < 50 ? 'text-amber-700 font-bold' : 'text-stone-700'}`}>
                    {p.stockQuantity} {p.stockQuantity < 50 && <Icon name="alert" title="Sắp hết hàng" size={13} className="text-amber-500" />}
                  </span>
                </td>
                <td className="px-3.5 py-2 text-right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer border border-amber-200/60"
                      onClick={() => setEditing(p)}
                    >
                      <Icon name="edit" size={13} /> Sửa
                    </button>
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer border border-red-200/60 disabled:opacity-50"
                      onClick={() => setConfirmId(p.id)}
                      disabled={deleting === p.id}
                    >
                      {deleting === p.id ? '...' : <><Icon name="trash" size={13} /> Xóa</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        label="sản phẩm"
        onPage={setPage}
      />

      {confirmId && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa sản phẩm này không?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}

      {editing && (
        <EditModal
          product={editing}
          categories={categories}
          unitTypes={unitTypes}
          onSave={() => { setEditing(null); setPage(1); onRefresh() }}
          onClose={() => setEditing(null)}
        />
      )}

      {showAddModal && (
        <AddProduct
          onRefresh={onRefresh}
          onSuccess={() => { setShowAddModal(false); setPage(1); onRefresh() }}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {importResult && (
        <ImportPreviewModal
          result={importResult}
          onClose={() => setImportResult(null)}
          onImported={handleImported}
        />
      )}
    </div>
  )
}

export default ProductList
