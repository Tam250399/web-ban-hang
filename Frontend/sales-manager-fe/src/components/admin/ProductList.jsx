import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import { productService } from '../../services/productService'
import { uploadImage } from '../../services/uploadService'
import Pagination from '../common/Pagination'
import ConfirmModal from '../common/ConfirmModal'

const PAGE_SIZE = 10

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
    <div className="modal-overlay" onClick={onClose}>
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
                <input type="number" value={form.price} onChange={set('price')} required min="0" />
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
  const [search, setSearch]       = useState('')

  const filtered = products.filter(p =>
    p.productName?.toLowerCase().includes(search.toLowerCase()) ||
    p.productCode?.toLowerCase().includes(search.toLowerCase()) ||
    (p.categoryName || p.category || '')?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
          Danh sách sản phẩm <span className="count-badge">{products.length}</span>
        </h3>
        <input
          className="search-input"
          style={{ maxWidth: 280 }}
          placeholder="Tìm theo tên, mã, danh mục..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
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
                  {(page - 1) * PAGE_SIZE + i + 1}
                </td>
                <td>
                  {p.imageUrl ? (
                    <img
                      src={p.imageUrl}
                      alt={p.productName}
                      className="product-thumb"
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
    </div>
  )
}

export default ProductList
