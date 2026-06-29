import { useEffect, useState } from 'react'
import { API } from './api'

// ---- Component CRUD tái sử dụng cho danh mục đơn giản (tên + mô tả) ----
function SimpleCrudTable({ title, items, onAdd, onEdit, onDelete }) {
  const [form, setForm] = useState({ name: '', description: '' })
  const [editId, setEditId] = useState(null)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const reset = () => { setForm({ name: '', description: '' }); setEditId(null); setMsg(null) }

  const startEdit = (item) => {
    setEditId(item.id)
    setForm({ name: item.name, description: item.description || '' })
    setMsg(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const err = await (editId ? onEdit(editId, form) : onAdd(form))
      if (err) { setMsg({ type: 'error', text: err }) }
      else { setMsg({ type: 'success', text: editId ? 'Cập nhật thành công!' : 'Thêm thành công!' }); reset() }
    } catch { setMsg({ type: 'error', text: 'Lỗi kết nối.' }) }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận xóa?')) return
    setDeleting(id)
    await onDelete(id)
    setDeleting(null)
  }

  return (
    <div className="crud-section">
      <h4 className="crud-title">{title}</h4>
      <div className="crud-layout">

        {/* Form thêm / sửa */}
        <div className="form-card" style={{ minWidth: 280 }}>
          <h5 style={{ margin: '0 0 14px', fontWeight: 700 }}>
            {editId ? '✏️ Chỉnh sửa' : '➕ Thêm mới'}
          </h5>
          <form onSubmit={handleSubmit} className="add-product-form">
            <label className="form-field">
              <span>Tên <span className="required">*</span></span>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Nhập tên..." />
            </label>
            <label className="form-field">
              <span>Mô tả</span>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Mô tả (tuỳ chọn)..." />
            </label>
            {msg && <p className={`message ${msg.type}`}>{msg.text}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? '...' : editId ? 'Lưu' : 'Thêm'}
              </button>
              {editId && <button type="button" className="btn-ghost" onClick={reset}>Hủy</button>}
            </div>
          </form>
        </div>

        {/* Bảng danh sách */}
        <div style={{ flex: 1 }}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Tên</th><th>Mô tả</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Chưa có dữ liệu</td></tr>
                )}
                {items.map((item, i) => (
                  <tr key={item.id} className={editId === item.id ? 'editing-row' : ''}>
                    <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td><strong>{item.name}</strong></td>
                    <td style={{ color: 'var(--text)', fontSize: '0.88rem' }}>{item.description || '-'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-edit-sm" onClick={() => startEdit(item)}>✏️ Sửa</button>
                        <button className="btn-danger-sm" onClick={() => handleDelete(item.id)} disabled={deleting === item.id}>
                          {deleting === item.id ? '...' : '🗑️ Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- CRUD cho Danh mục tên sản phẩm (có thêm trường CategoryId) ----
function ProductNameCrud({ items, categories, onAdd, onEdit, onDelete }) {
  const [form, setForm] = useState({ name: '', categoryId: '' })
  const [editId, setEditId] = useState(null)
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const reset = () => { setForm({ name: '', categoryId: '' }); setEditId(null); setMsg(null) }

  const startEdit = (item) => {
    setEditId(item.id)
    setForm({ name: item.name, categoryId: item.categoryId || '' })
    setMsg(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    const payload = { name: form.name, categoryId: form.categoryId ? +form.categoryId : null }
    try {
      const err = await (editId ? onEdit(editId, payload) : onAdd(payload))
      if (err) { setMsg({ type: 'error', text: err }) }
      else { setMsg({ type: 'success', text: editId ? 'Cập nhật thành công!' : 'Thêm thành công!' }); reset() }
    } catch { setMsg({ type: 'error', text: 'Lỗi kết nối.' }) }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Xác nhận xóa?')) return
    setDeleting(id)
    await onDelete(id)
    setDeleting(null)
  }

  return (
    <div className="crud-section">
      <h4 className="crud-title">Danh mục tên sản phẩm</h4>
      <div className="crud-layout">

        <div className="form-card" style={{ minWidth: 280 }}>
          <h5 style={{ margin: '0 0 14px', fontWeight: 700 }}>
            {editId ? '✏️ Chỉnh sửa' : '➕ Thêm mới'}
          </h5>
          <form onSubmit={handleSubmit} className="add-product-form">
            <label className="form-field">
              <span>Thuộc danh mục</span>
              <select value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                <option value="">-- Tất cả danh mục --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="form-field">
              <span>Tên sản phẩm <span className="required">*</span></span>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="VD: Xi măng Hà Tiên PC40..." />
            </label>
            {msg && <p className={`message ${msg.type}`}>{msg.text}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" type="submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? '...' : editId ? 'Lưu' : 'Thêm'}
              </button>
              {editId && <button type="button" className="btn-ghost" onClick={reset}>Hủy</button>}
            </div>
          </form>
        </div>

        <div style={{ flex: 1 }}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Chưa có dữ liệu</td></tr>
                )}
                {items.map((item, i) => (
                  <tr key={item.id} className={editId === item.id ? 'editing-row' : ''}>
                    <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.categoryName ? <span className="cat-tag">{item.categoryName}</span> : '-'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-edit-sm" onClick={() => startEdit(item)}>✏️ Sửa</button>
                        <button className="btn-danger-sm" onClick={() => handleDelete(item.id)} disabled={deleting === item.id}>
                          {deleting === item.id ? '...' : '🗑️ Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

// ---- Main CategoryManager ----
const SUB_TABS = [
  { key: 'categories', label: '🏷️ Danh mục sản phẩm' },
  { key: 'names',      label: '📝 Tên sản phẩm' },
  { key: 'units',      label: '📐 Đơn vị tính' },
]

function CategoryManager() {
  const [sub, setSub] = useState('categories')
  const [categories, setCategories] = useState([])
  const [names, setNames] = useState([])
  const [units, setUnits] = useState([])

  const load = {
    categories: () => fetch(`${API}/category/product-categories`).then(r => r.json()).then(setCategories).catch(() => {}),
    names: () => fetch(`${API}/category/product-names`).then(r => r.json()).then(setNames).catch(() => {}),
    units: () => fetch(`${API}/category/unit-types`).then(r => r.json()).then(setUnits).catch(() => {}),
  }

  useEffect(() => { load.categories(); load.names(); load.units() }, [])

  // Helper: gọi API và trả về lỗi hoặc null
  const call = async (url, method, body) => {
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
    if (!res.ok) { const d = await res.json(); return d.message || 'Lỗi.' }
    return null
  }

  const catApi = {
    add:    (body) => call(`${API}/category/product-categories`, 'POST', body).then(e => { if (!e) load.categories(); return e }),
    edit:   (id, body) => call(`${API}/category/product-categories/${id}`, 'PUT', body).then(e => { if (!e) load.categories(); return e }),
    delete: (id) => call(`${API}/category/product-categories/${id}`, 'DELETE').then(() => load.categories()),
  }

  const nameApi = {
    add:    (body) => call(`${API}/category/product-names`, 'POST', body).then(e => { if (!e) load.names(); return e }),
    edit:   (id, body) => call(`${API}/category/product-names/${id}`, 'PUT', body).then(e => { if (!e) load.names(); return e }),
    delete: (id) => call(`${API}/category/product-names/${id}`, 'DELETE').then(() => load.names()),
  }

  const unitApi = {
    add:    (body) => call(`${API}/category/unit-types`, 'POST', body).then(e => { if (!e) load.units(); return e }),
    edit:   (id, body) => call(`${API}/category/unit-types/${id}`, 'PUT', body).then(e => { if (!e) load.units(); return e }),
    delete: (id) => call(`${API}/category/unit-types/${id}`, 'DELETE').then(() => load.units()),
  }

  return (
    <div>
      <h3 className="tab-title">Quản lý danh mục</h3>

      {/* Sub-tabs */}
      <div className="sub-tabs">
        {SUB_TABS.map(t => (
          <button
            key={t.key}
            className={`sub-tab-btn ${sub === t.key ? 'active' : ''}`}
            onClick={() => setSub(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 24 }}>
        {sub === 'categories' && (
          <SimpleCrudTable
            title="Danh mục sản phẩm"
            items={categories}
            onAdd={catApi.add}
            onEdit={catApi.edit}
            onDelete={catApi.delete}
          />
        )}
        {sub === 'names' && (
          <ProductNameCrud
            items={names}
            categories={categories}
            onAdd={nameApi.add}
            onEdit={nameApi.edit}
            onDelete={nameApi.delete}
          />
        )}
        {sub === 'units' && (
          <SimpleCrudTable
            title="Danh mục đơn vị tính"
            items={units}
            onAdd={unitApi.add}
            onEdit={unitApi.edit}
            onDelete={unitApi.delete}
          />
        )}
      </div>
    </div>
  )
}

export default CategoryManager
