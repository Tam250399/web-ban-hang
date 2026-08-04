import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { categoryService } from '../../services/categoryService'
import Pagination from '../common/Pagination'
import ConfirmModal from '../common/ConfirmModal'

// ---- CRUD cho danh mục có trường tên + mô tả ----
function SimpleCrudTable({ title, items, onAdd, onEdit, onDelete }) {
  const [form, setForm]     = useState({ name: '', description: '' })
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [page, setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const reset = () => { setForm({ name: '', description: '' }); setEditId(null) }

  const startEdit = (item) => {
    setEditId(item.id)
    setForm({ name: item.name, description: item.description || '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await (editId ? onEdit(editId, form) : onAdd(form))
      toast.success(editId ? 'Cập nhật thành công!' : 'Thêm thành công!')
      reset()
    } catch (err) {
      toast.error(err.message || 'Lỗi kết nối.')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const id = confirmId
    setConfirmId(null)
    setDeleting(id)
    try {
      await onDelete(id)
      toast.success('Đã xóa thành công!')
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại.')
    }
    setDeleting(null)
  }

  const totalPages = Math.ceil(items.length / pageSize)
  const paginated  = items.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="crud-section">
      <h4 className="crud-title">{title}</h4>
      <div className="crud-layout">

        <div className="form-card" style={{ minWidth: 280 }}>
          <h5 style={{ margin: '0 0 14px', fontWeight: 700 }}>
            {editId ? '✏️ Chỉnh sửa' : '➕ Thêm mới'}
          </h5>
          <form onSubmit={handleSubmit} className="add-product-form">
            <label className="form-field">
              <span>Tên <span className="required">*</span></span>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Nhập tên..."
              />
            </label>
            <label className="form-field">
              <span>Mô tả</span>
              <input
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả (tuỳ chọn)..."
              />
            </label>
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
                <tr><th>#</th><th>Tên</th><th>Mô tả</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {items.length === 0 && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Chưa có dữ liệu</td></tr>
                )}
                {paginated.map((item, i) => (
                  <tr key={item.id} className={editId === item.id ? 'editing-row' : ''}>
                    <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                    <td><strong>{item.name}</strong></td>
                    <td style={{ color: 'var(--text)', fontSize: '0.88rem' }}>{item.description || '-'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-edit-sm" onClick={() => startEdit(item)}>✏️ Sửa</button>
                        <button className="btn-danger-sm" onClick={() => setConfirmId(item.id)} disabled={deleting === item.id}>
                          {deleting === item.id ? '...' : '🗑️ Xóa'}
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
            total={items.length}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
            label="mục"
            onPage={setPage}
          />
        </div>
      </div>
      {confirmId && (
        <ConfirmModal
          message={`Bạn có chắc muốn xóa mục này không?`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

// ---- CRUD cho Tên sản phẩm mẫu (có thêm danh mục) ----
function ProductNameCrud({ items, categories, onAdd, onEdit, onDelete }) {
  const [form, setForm]     = useState({ name: '', categoryId: '' })
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [page, setPage]     = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const reset = () => { setForm({ name: '', categoryId: '' }); setEditId(null) }

  const startEdit = (item) => {
    setEditId(item.id)
    setForm({ name: item.name, categoryId: item.categoryId || '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const payload = { name: form.name, categoryId: form.categoryId ? +form.categoryId : null }
    try {
      await (editId ? onEdit(editId, payload) : onAdd(payload))
      toast.success(editId ? 'Cập nhật thành công!' : 'Thêm thành công!')
      reset()
    } catch (err) {
      toast.error(err.message || 'Lỗi kết nối.')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const id = confirmId
    setConfirmId(null)
    setDeleting(id)
    try {
      await onDelete(id)
      toast.success('Đã xóa thành công!')
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại.')
    }
    setDeleting(null)
  }

  const totalPages = Math.ceil(items.length / pageSize)
  const paginated  = items.slice((page - 1) * pageSize, page * pageSize)

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
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="VD: Xi măng Hà Tiên PC40..."
              />
            </label>
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
                {paginated.map((item, i) => (
                  <tr key={item.id} className={editId === item.id ? 'editing-row' : ''}>
                    <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                    <td><strong>{item.name}</strong></td>
                    <td>{item.categoryName ? <span className="cat-tag">{item.categoryName}</span> : '-'}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-edit-sm" onClick={() => startEdit(item)}>✏️ Sửa</button>
                        <button className="btn-danger-sm" onClick={() => setConfirmId(item.id)} disabled={deleting === item.id}>
                          {deleting === item.id ? '...' : '🗑️ Xóa'}
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
            total={items.length}
            pageSize={pageSize}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
            label="tên"
            onPage={setPage}
          />
        </div>
      </div>
      {confirmId && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa tên sản phẩm này không?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
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
  const [sub, setSub]             = useState('categories')
  const [categories, setCategories] = useState([])
  const [names, setNames]         = useState([])
  const [units, setUnits]         = useState([])

  const reload = {
    categories: () => categoryService.getCategories().then(setCategories).catch(() => {}),
    names:      () => categoryService.getProductNames().then(setNames).catch(() => {}),
    units:      () => categoryService.getUnitTypes().then(setUnits).catch(() => {}),
  }

  useEffect(() => { reload.categories(); reload.names(); reload.units() }, [])

  const catApi = {
    add:    (body) => categoryService.createCategory(body).then(() => reload.categories()),
    edit:   (id, body) => categoryService.updateCategory(id, body).then(() => reload.categories()),
    delete: (id)   => categoryService.deleteCategory(id).then(() => reload.categories()),
  }

  const nameApi = {
    add:    (body) => categoryService.createProductName(body).then(() => reload.names()),
    edit:   (id, body) => categoryService.updateProductName(id, body).then(() => reload.names()),
    delete: (id)   => categoryService.deleteProductName(id).then(() => reload.names()),
  }

  const unitApi = {
    add:    (body) => categoryService.createUnitType(body).then(() => reload.units()),
    edit:   (id, body) => categoryService.updateUnitType(id, body).then(() => reload.units()),
    delete: (id)   => categoryService.deleteUnitType(id).then(() => reload.units()),
  }

  return (
    <div>
      <h3 className="tab-title">Quản lý danh mục</h3>

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
