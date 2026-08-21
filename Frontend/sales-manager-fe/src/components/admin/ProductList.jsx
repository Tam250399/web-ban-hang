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

const IMPORT_STATUS_LABEL = { New: 'Mới', Duplicate: 'Trùng mã', Invalid: 'Lỗi' }
const IMPORT_STATUS_CLASS = { New: 'new', Duplicate: 'duplicate', Invalid: 'invalid' }

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
    // Không đóng khi bấm ra ngoài: bảng chọn dòng khi nhập Excel rất dễ bị tắt nhầm
    // khi đang thao tác, chỉ đóng qua nút ✕ hoặc sau khi lưu thành công.
    <div className="modal-overlay">
      <div className="modal-box import-preview-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Xem trước dữ liệu nhập</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '14px 24px 0' }}>
          <div className="import-summary">
            <span>Tổng <strong>{result.total}</strong> dòng</span>
            <span className="import-status-badge new">Mới: {result.newCount}</span>
            <span className="import-status-badge duplicate">Trùng mã: {result.duplicateCount}</span>
            <span className="import-status-badge invalid">Lỗi: {result.invalidCount}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text)', margin: '8px 0 0' }}>
            Dòng "Trùng mã" nếu chọn sẽ <strong>ghi đè</strong> sản phẩm hiện có cùng mã. Dòng "Lỗi" không thể chọn.
          </p>
        </div>

        <div className="admin-table-wrap" style={{ margin: '14px 24px', maxHeight: 360, overflowY: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}></th>
                <th>Dòng</th><th>Mã SP</th><th>Tên sản phẩm</th><th>Danh mục</th><th>ĐVT</th>
                <th>Giá bán</th><th>Tồn kho</th><th>Trạng thái</th>
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
                  <td>{r.categoryName || '-'}</td>
                  <td>{r.unitName || '-'}</td>
                  <td>{r.price?.toLocaleString('vi-VN')}đ</td>
                  <td>{r.stockQuantity}</td>
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
            {committing ? 'Đang nhập...' : `Xác nhận nhập ${selected.size} sản phẩm`}
          </button>
        </div>
      </div>
    </div>
  )
}

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
  const [imagePreview, setImagePreview] = useState(product.imageUrl || null)
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
      setImagePreview(product.imageUrl || null)
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
    // Không đóng khi bấm ra ngoài: form sửa sản phẩm (có upload ảnh) rất dễ bị tắt nhầm
    // khi đang thao tác, chỉ đóng qua nút ✕ hoặc sau khi lưu thành công.
    <div className="modal-overlay">
      <div className="modal-box edit-product-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chỉnh sửa sản phẩm</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="edit-modal-body">

            {/* Cột trái — ảnh */}
            <div className="edit-modal-image">
              <p className="form-field-label">Hình ảnh</p>
              {imagePreview ? (
                <div className="image-upload-preview" style={{ maxHeight: 220 }}>
                  <img src={imagePreview} alt="preview" />
                  {uploading && <div className="image-upload-overlay">Đang tải...</div>}
                  {!uploading && (
                    <button type="button" className="image-remove-btn" onClick={removeImage}>✕</button>
                  )}
                </div>
              ) : (
                <label className={`image-upload-zone ${uploading ? 'uploading' : ''}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                  <span className="image-upload-icon">🖼️</span>
                  <span>{uploading ? 'Đang tải lên...' : 'Nhấn để chọn ảnh'}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>JPG, PNG, WEBP · Tối đa 5MB</span>
                </label>
              )}
            </div>

            {/* Cột phải — thông tin */}
            <div className="edit-modal-fields">
              <label className="form-field">
                <span>Mã sản phẩm</span>
                <input value={product.productCode} disabled style={{ opacity: 0.5 }} />
              </label>

              <label className="form-field">
                <span>Tên sản phẩm <span className="required">*</span></span>
                <input value={form.productName} onChange={set('productName')} required />
              </label>

              <div className="form-row">
                <label className="form-field">
                  <span>Danh mục</span>
                  <select value={form.categoryId} onChange={set('categoryId')}>
                    <option value="">-- Chọn danh mục --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </label>
                <label className="form-field">
                  <span>Đơn vị tính</span>
                  <select value={form.unitTypeId} onChange={set('unitTypeId')}>
                    <option value="">-- Chọn đơn vị --</option>
                    {unitTypes.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </label>
              </div>

              <label className="form-field">
                <span>Giá bán (VNĐ) <span className="required">*</span></span>
                <MoneyInput value={form.price} onChange={set('price')} required min="0" />
              </label>

              <label className="form-field">
                <span>Mô tả</span>
                <input value={form.description} onChange={set('description')} placeholder="Mô tả ngắn..." />
              </label>
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={loading || uploading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

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

  const filtered = products.filter(p =>
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
    <div>
      <div className="list-header">
        <h3 className="tab-title" style={{ margin: 0 }}>
          Danh sách sản phẩm <span className="count-badge">{filtered.length}</span>
        </h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx"
            onChange={handleImportFileChange}
            style={{ display: 'none' }}
          />
          <button className="btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={() => setShowAddModal(true)}>+ Thêm mới</button>
          <OverflowMenu
            label="Thao tác Excel"
            items={[
              { label: '📥 Tải file mẫu', onClick: handleDownloadTemplate },
              { label: '📤 Xuất Excel', onClick: handleExport },
              { label: uploading ? 'Đang đọc...' : '📄 Nhập Excel', onClick: () => fileInputRef.current?.click(), disabled: uploading },
            ]}
          />
        </div>
      </div>

      <div className="admin-filter-bar">
        <input
          className="search-input"
          placeholder="Tìm theo tên, mã, danh mục..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
        {search && (
          <button type="button" className="btn-ghost" onClick={() => { setSearch(''); setPage(1) }}>Xóa lọc</button>
        )}
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Ảnh</th>
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
            {paginated.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: 32 }}>
                  {search ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
                </td>
              </tr>
            )}
            {paginated.map((p, i) => (
              <tr key={p.id} className={p.stockQuantity < 50 ? 'low-stock-row' : ''}>
                <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>
                  {(page - 1) * pageSize + i + 1}
                </td>
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
                    <div className="product-thumb-placeholder">🧱</div>
                  )}
                </td>
                <td><code>{p.productCode}</code></td>
                <td><strong>{p.productName}</strong></td>
                <td><span className="cat-tag">{p.categoryName || p.category || 'Khác'}</span></td>
                <td>{p.unitTypeName || p.unit}</td>
                <td className="price-cell">{p.price?.toLocaleString('vi-VN')}đ</td>
                <td className={p.stockQuantity < 50 ? 'warn-cell' : ''}>
                  {p.stockQuantity} {p.stockQuantity < 50 ? '⚠️' : ''}
                </td>
                <td>
                  <div className="action-btns">
                    <button className="btn-edit-sm" onClick={() => setEditing(p)}>✏️ Sửa</button>
                    <button
                      className="btn-danger-sm"
                      onClick={() => setConfirmId(p.id)}
                      disabled={deleting === p.id}
                    >
                      {deleting === p.id ? '...' : '🗑️ Xóa'}
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
          onSave={() => { setEditing(null); onRefresh() }}
          onClose={() => setEditing(null)}
        />
      )}

      {showAddModal && (
        <AddProduct
          onRefresh={onRefresh}
          onSuccess={() => { setShowAddModal(false); onRefresh() }}
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
