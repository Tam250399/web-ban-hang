import { useState } from 'react'
import { API } from './api'

const PAGE_SIZE = 10

function EditModal({ product, categories, unitTypes, onSave, onClose }) {
  const [form, setForm] = useState({
    productName: product.productName,
    categoryId: product.categoryId || '',
    unitTypeId: product.unitTypeId || '',
    price: product.price,
    description: product.description || '',
    imageUrl: product.imageUrl || '',
  })
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState(null)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`${API}/product/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productCode: product.productCode,
          productName: form.productName,
          unit: '',
          price: +form.price,
          stockQuantity: product.stockQuantity,
          description: form.description,
          imageUrl: form.imageUrl,
          categoryId: form.categoryId ? +form.categoryId : null,
          unitTypeId: form.unitTypeId ? +form.unitTypeId : null,
        })
      })
      if (res.ok) {
        onSave()
      } else {
        const data = await res.json()
        setMsg(data.message || 'Có lỗi xảy ra.')
      }
    } catch {
      setMsg('Không thể kết nối máy chủ.')
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Chỉnh sửa sản phẩm</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="add-product-form">
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
            <input value={form.description} onChange={set('description')} />
          </label>
          <label className="form-field">
            <span>URL hình ảnh</span>
            <input value={form.imageUrl} onChange={set('imageUrl')} />
          </label>
          {msg && <p className="message error">{msg}</p>}
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProductList({ products, categories, unitTypes, onRefresh }) {
  const [deleting, setDeleting] = useState(null)
  const [editing, setEditing] = useState(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')

  const filtered = products.filter(p =>
    p.productName?.toLowerCase().includes(search.toLowerCase()) ||
    p.productCode?.toLowerCase().includes(search.toLowerCase()) ||
    (p.categoryName || p.category || '')?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận xóa sản phẩm này?')) return
    setDeleting(id)
    await fetch(`${API}/product/${id}`, { method: 'DELETE' })
    onRefresh()
    setDeleting(null)
  }

  const handleSearch = (e) => {
    setSearch(e.target.value)
    setPage(1)
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
          onChange={handleSearch}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
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
                <td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: 32 }}>
                  {search ? 'Không tìm thấy sản phẩm phù hợp' : 'Chưa có sản phẩm nào'}
                </td>
              </tr>
            )}
            {paginated.map((p, i) => (
              <tr key={p.id} className={p.stockQuantity < 50 ? 'low-stock-row' : ''}>
                <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>
                  {(page - 1) * PAGE_SIZE + i + 1}
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
                      onClick={() => handleDelete(p.id)}
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

      {/* Phân trang */}
      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => setPage(1)} disabled={page === 1}>«</button>
          <button className="page-btn" onClick={() => setPage(p => p - 1)} disabled={page === 1}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
            .reduce((acc, p, idx, arr) => {
              if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('...')
              acc.push(p)
              return acc
            }, [])
            .map((p, i) =>
              p === '...'
                ? <span key={i} className="page-ellipsis">…</span>
                : <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
            )
          }
          <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>›</button>
          <button className="page-btn" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</button>
          <span className="page-info">{filtered.length} sản phẩm</span>
        </div>
      )}

      {/* Modal chỉnh sửa */}
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
