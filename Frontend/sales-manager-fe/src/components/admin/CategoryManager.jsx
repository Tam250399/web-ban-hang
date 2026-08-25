import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { categoryService } from '../../services/categoryService'
import Pagination from '../common/Pagination'
import ConfirmModal from '../common/ConfirmModal'

// ---- Modal thêm/sửa chung (tên + mô tả, tuỳ chọn cờ hiển thị trang chủ) ----
function SimpleFormModal({ title, item, onSave, onClose, withHomeToggle }) {
  const isEdit = !!item
  const [form, setForm] = useState({
    name: item?.name || '',
    description: item?.description || '',
    ...(withHomeToggle ? { showOnHome: item?.showOnHome ?? true } : {}),
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onSave(isEdit ? item.id : null, form, isEdit)
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3>{isEdit ? `✏️ Chỉnh sửa ${title}` : `➕ Thêm ${title}`}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="add-product-form" style={{ padding: '20px 24px' }}>
            <label className="form-field">
              <span>Tên <span className="required">*</span></span>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Nhập tên..."
                autoFocus
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
            {withHomeToggle && (
              <label className="form-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={form.showOnHome}
                  onChange={e => setForm(f => ({ ...f, showOnHome: e.target.checked }))}
                />
                <span>Hiển thị làm bộ lọc ở trang chủ</span>
              </label>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Modal thêm/sửa tên sản phẩm (có thêm danh mục) ----
function ProductNameFormModal({ item, categories, onSave, onClose }) {
  const isEdit = !!item
  const [form, setForm] = useState({
    name: item?.name || '',
    categoryId: item?.categoryId || ''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const payload = { name: form.name, categoryId: form.categoryId ? +form.categoryId : null }
    try {
      await onSave(isEdit ? item.id : null, payload, isEdit)
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Chỉnh sửa tên sản phẩm' : '➕ Thêm tên sản phẩm'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="add-product-form" style={{ padding: '20px 24px' }}>
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
                autoFocus
              />
            </label>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- CRUD table chung (danh mục, đơn vị tính) ----
function SimpleCrudTable({ title, modalTitle, items, loading, onAdd, onEdit, onDelete, withHomeToggle }) {
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const openAdd = () => { setEditItem(null); setShowModal(true) }
  const openEdit = (item) => { setEditItem(item); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditItem(null) }

  const handleSave = async (id, data, isEdit) => {
    await (isEdit ? onEdit(id, data) : onAdd(data))
    toast.success(isEdit ? 'Cập nhật thành công!' : 'Thêm thành công!')
    closeModal()
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

  const handleToggleHome = async (item) => {
    setToggling(item.id)
    try {
      await onEdit(item.id, { ...item, showOnHome: !item.showOnHome })
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại.')
    }
    setToggling(null)
  }

  const filtered = items.filter(item =>
    item.name?.toLowerCase().includes(search.trim().toLowerCase()) ||
    item.description?.toLowerCase().includes(search.trim().toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="crud-section">
      <div className="list-header">
        <h4 className="crud-title" style={{ margin: 0 }}>
          {title} <span className="count-badge">{filtered.length}</span>
        </h4>
        <button className="btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={openAdd}>+ Thêm mới</button>
      </div>

      <div className="admin-filter-bar">
        <input
          className="search-input"
          placeholder="Tìm theo tên..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Tên</th><th>Mô tả</th>{withHomeToggle && <th>Trang chủ</th>}<th>Thao tác</th></tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={withHomeToggle ? 5 : 4} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Đang tải...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={withHomeToggle ? 5 : 4} style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                {items.length === 0 ? 'Chưa có dữ liệu' : 'Không tìm thấy kết quả phù hợp'}
              </td></tr>
            )}
            {!loading && paginated.map((item, i) => (
              <tr key={item.id} style={{ opacity: deleting === item.id ? 0.5 : 1 }}>
                <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                <td><strong>{item.name}</strong></td>
                <td style={{ color: 'var(--text)', fontSize: '0.88rem' }}>{item.description || '-'}</td>
                {withHomeToggle && (
                  <td>
                    <label className="toggle-switch" style={{ opacity: toggling === item.id ? 0.6 : 1 }}>
                      <input
                        type="checkbox"
                        checked={item.showOnHome}
                        disabled={toggling === item.id}
                        onChange={() => handleToggleHome(item)}
                      />
                      <span className="toggle-track"><span className="toggle-thumb" /></span>
                      <span className="toggle-label">{item.showOnHome ? 'Hiển thị' : 'Ẩn'}</span>
                    </label>
                  </td>
                )}
                <td>
                  <div className="action-btns">
                    <button className="btn-edit-sm" onClick={() => openEdit(item)} disabled={deleting === item.id}>✏️ Sửa</button>
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

      {showModal && (
        <SimpleFormModal
          title={modalTitle || title}
          item={editItem}
          onSave={handleSave}
          onClose={closeModal}
          withHomeToggle={withHomeToggle}
        />
      )}

      {confirmId && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa mục này không?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

// ---- CRUD table cho Tên sản phẩm mẫu ----
function ProductNameCrud({ items, categories, loading, onAdd, onEdit, onDelete }) {
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const openAdd = () => { setEditItem(null); setShowModal(true) }
  const openEdit = (item) => { setEditItem(item); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditItem(null) }

  const handleSave = async (id, data, isEdit) => {
    await (isEdit ? onEdit(id, data) : onAdd(data))
    toast.success(isEdit ? 'Cập nhật thành công!' : 'Thêm thành công!')
    closeModal()
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

  const filtered = items.filter(item =>
    item.name?.toLowerCase().includes(search.trim().toLowerCase()) ||
    item.categoryName?.toLowerCase().includes(search.trim().toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="crud-section">
      <div className="list-header">
        <h4 className="crud-title" style={{ margin: 0 }}>
          Danh mục tên sản phẩm <span className="count-badge">{filtered.length}</span>
        </h4>
        <button className="btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={openAdd}>+ Thêm mới</button>
      </div>

      <div className="admin-filter-bar">
        <input
          className="search-input"
          placeholder="Tìm theo tên sản phẩm hoặc danh mục..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Tên sản phẩm</th><th>Danh mục</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Đang tải...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                {items.length === 0 ? 'Chưa có dữ liệu' : 'Không tìm thấy kết quả phù hợp'}
              </td></tr>
            )}
            {!loading && paginated.map((item, i) => (
              <tr key={item.id} style={{ opacity: deleting === item.id ? 0.5 : 1 }}>
                <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                <td><strong>{item.name}</strong></td>
                <td>{item.categoryName ? <span className="cat-tag">{item.categoryName}</span> : '-'}</td>
                <td>
                  <div className="action-btns">
                    <button className="btn-edit-sm" onClick={() => openEdit(item)} disabled={deleting === item.id}>✏️ Sửa</button>
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

      {showModal && (
        <ProductNameFormModal
          item={editItem}
          categories={categories}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

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
  { key: 'names',      label: '📝 Tên sản phẩm' },
  { key: 'categories', label: '🏷️ Danh mục sản phẩm' },
  { key: 'units',      label: '📐 Đơn vị tính' },
]

function CategoryManager() {
  const [sub, setSub]             = useState('names')
  const [categories, setCategories] = useState([])
  const [names, setNames]         = useState([])
  const [units, setUnits]         = useState([])
  const [loading, setLoading]     = useState(true)

  // useMemo để `reload` giữ nguyên tham chiếu qua các lần render — nhờ vậy mới
  // khai báo được nó trong deps của useEffect mà không tạo vòng lặp tải lại.
  const reload = useMemo(() => ({
    categories: () => categoryService.getCategories().then(setCategories).catch(() => {}),
    names:      () => categoryService.getProductNames().then(setNames).catch(() => {}),
    units:      () => categoryService.getUnitTypes().then(setUnits).catch(() => {}),
  }), [])

  useEffect(() => {
    Promise.all([reload.categories(), reload.names(), reload.units()]).finally(() => setLoading(false))
  }, [reload])

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
        {sub === 'names' && (
          <ProductNameCrud
            items={names}
            categories={categories}
            loading={loading}
            onAdd={nameApi.add}
            onEdit={nameApi.edit}
            onDelete={nameApi.delete}
          />
        )}
        {sub === 'categories' && (
          <SimpleCrudTable
            title="Danh mục sản phẩm"
            modalTitle="danh mục"
            items={categories}
            loading={loading}
            onAdd={catApi.add}
            onEdit={catApi.edit}
            onDelete={catApi.delete}
            withHomeToggle
          />
        )}
        {sub === 'units' && (
          <SimpleCrudTable
            title="Danh mục đơn vị tính"
            modalTitle="đơn vị tính"
            items={units}
            loading={loading}
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
