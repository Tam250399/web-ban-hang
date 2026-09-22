import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { categoryService } from '../../services/categoryService'
import Pagination from '../common/Pagination'
import ConfirmModal from '../common/ConfirmModal'
import { Icon } from '../common/Icon'

/**
 * Component SimpleFormModal
 */
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
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <Icon name={isEdit ? 'edit' : 'plus'} size={18} className="text-primary" /> {`${isEdit ? 'Chỉnh sửa' : 'Thêm'} ${title}`}
          </h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer text-sm font-bold" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <label className="block text-xs sm:text-sm font-semibold text-stone-700">
              <span>Tên <span className="text-red-500">*</span></span>
              <input
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="Nhập tên..."
                autoFocus
              />
            </label>
            <label className="block text-xs sm:text-sm font-semibold text-stone-700">
              <span>Mô tả</span>
              <input
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Mô tả (tuỳ chọn)..."
              />
            </label>
            {withHomeToggle && (
              <label className="inline-flex items-center gap-3 cursor-pointer py-1 select-none">
                <input
                  type="checkbox"
                  checked={form.showOnHome}
                  onChange={e => setForm(f => ({ ...f, showOnHome: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
                <span className="text-xs sm:text-sm font-bold text-stone-800">Hiển thị làm bộ lọc ở trang chủ</span>
              </label>
            )}
          </div>
          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs sm:text-sm transition cursor-pointer" onClick={onClose}>Hủy</button>
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Component ProductNameFormModal
 */
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
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <Icon name={isEdit ? 'edit' : 'plus'} size={18} className="text-primary" /> {isEdit ? 'Chỉnh sửa tên sản phẩm' : 'Thêm tên sản phẩm'}
          </h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer text-sm font-bold" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <label className="block text-xs sm:text-sm font-semibold text-stone-700">
              <span>Thuộc danh mục</span>
              <select
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">-- Tất cả danh mục --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label className="block text-xs sm:text-sm font-semibold text-stone-700">
              <span>Tên sản phẩm <span className="text-red-500">*</span></span>
              <input
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="VD: Xi măng Hà Tiên PC40..."
                autoFocus
              />
            </label>
          </div>
          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs sm:text-sm transition cursor-pointer" onClick={onClose}>Hủy</button>
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Component SimpleCrudTable
 */
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
    setPage(1)
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

  const sorted = [...items].sort((a, b) => (b.id || 0) - (a.id || 0))
  const filtered = sorted.filter(item =>
    item.name?.toLowerCase().includes(search.trim().toLowerCase()) ||
    item.description?.toLowerCase().includes(search.trim().toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
          {title}
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {filtered.length}
          </span>
        </h4>
        <button
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer shrink-0"
          onClick={openAdd}
        >
          <Icon name="plus" size={16} /> Thêm mới
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full pl-10 pr-4 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            placeholder="Tìm theo tên..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="px-3.5 py-2.5">#</th>
              <th className="px-3.5 py-2.5">Tên</th>
              <th className="px-3.5 py-2.5">Mô tả</th>
              {withHomeToggle && <th className="px-3.5 py-2.5">Trang chủ</th>}
              <th className="px-3.5 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading && (
              <tr><td colSpan={withHomeToggle ? 5 : 4} className="text-center py-12 text-stone-400 text-xs sm:text-sm">Đang tải...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={withHomeToggle ? 5 : 4} className="text-center py-12 text-stone-400 text-xs sm:text-sm">
                {items.length === 0 ? 'Chưa có dữ liệu' : 'Không tìm thấy kết quả phù hợp'}
              </td></tr>
            )}
            {!loading && paginated.map((item, i) => (
              <tr key={item.id} className={`hover:bg-stone-50/60 transition ${deleting === item.id ? 'opacity-50' : ''}`}>
                <td className="px-3.5 py-2 text-stone-400 text-xs">{(page - 1) * pageSize + i + 1}</td>
                <td className="px-3.5 py-2 font-bold text-stone-900">{item.name}</td>
                <td className="px-3.5 py-2 text-stone-600">{item.description || '-'}</td>
                {withHomeToggle && (
                  <td className="px-3.5 py-2">
                    <label className={`inline-flex items-center gap-2 cursor-pointer select-none ${toggling === item.id ? 'opacity-60 pointer-events-none' : ''}`}>
                      <input
                        type="checkbox"
                        checked={item.showOnHome}
                        disabled={toggling === item.id}
                        onChange={() => handleToggleHome(item)}
                        className="sr-only peer"
                      />
                      <div className="relative w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                      <span className="text-[11px] font-bold text-stone-600">{item.showOnHome ? 'Hiển thị' : 'Ẩn'}</span>
                    </label>
                  </td>
                )}
                <td className="px-3.5 py-2 text-right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer border border-amber-200/60 disabled:opacity-50"
                      onClick={() => openEdit(item)}
                      disabled={deleting === item.id}
                    >
                      <Icon name="edit" size={13} /> Sửa
                    </button>
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer border border-red-200/60 disabled:opacity-50"
                      onClick={() => setConfirmId(item.id)}
                      disabled={deleting === item.id}
                    >
                      {deleting === item.id ? '...' : <><Icon name="trash" size={13} /> Xóa</>}
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

/**
 * Component ProductNameCrud
 */
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
    setPage(1)
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

  const sorted = [...items].sort((a, b) => (b.id || 0) - (a.id || 0))
  const filtered = sorted.filter(item =>
    item.name?.toLowerCase().includes(search.trim().toLowerCase()) ||
    item.categoryName?.toLowerCase().includes(search.trim().toLowerCase())
  )
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
          Danh mục tên sản phẩm
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {filtered.length}
          </span>
        </h4>
        <button
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer shrink-0"
          onClick={openAdd}
        >
          <Icon name="plus" size={16} /> Thêm mới
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full pl-10 pr-4 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            placeholder="Tìm theo tên sản phẩm hoặc danh mục..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="px-3.5 py-2.5">#</th>
              <th className="px-3.5 py-2.5">Tên sản phẩm</th>
              <th className="px-3.5 py-2.5">Danh mục</th>
              <th className="px-3.5 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading && (
              <tr><td colSpan={4} className="text-center py-12 text-stone-400 text-xs sm:text-sm">Đang tải...</td></tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={4} className="text-center py-12 text-stone-400 text-xs sm:text-sm">
                {items.length === 0 ? 'Chưa có dữ liệu' : 'Không tìm thấy kết quả phù hợp'}
              </td></tr>
            )}
            {!loading && paginated.map((item, i) => (
              <tr key={item.id} className={`hover:bg-stone-50/60 transition ${deleting === item.id ? 'opacity-50' : ''}`}>
                <td className="px-3.5 py-2 text-stone-400 text-xs">{(page - 1) * pageSize + i + 1}</td>
                <td className="px-3.5 py-2 font-bold text-stone-900">{item.name}</td>
                <td className="px-3.5 py-2">
                  {item.categoryName ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                      {item.categoryName}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-3.5 py-2 text-right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer border border-amber-200/60 disabled:opacity-50"
                      onClick={() => openEdit(item)}
                      disabled={deleting === item.id}
                    >
                      <Icon name="edit" size={13} /> Sửa
                    </button>
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer border border-red-200/60 disabled:opacity-50"
                      onClick={() => setConfirmId(item.id)}
                      disabled={deleting === item.id}
                    >
                      {deleting === item.id ? '...' : <><Icon name="trash" size={13} /> Xóa</>}
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

const SUB_TABS = [
  { key: 'names',      label: 'Tên sản phẩm', icon: 'note' },
  { key: 'categories', label: 'Danh mục sản phẩm', icon: 'tag' },
  { key: 'units',      label: 'Đơn vị tính', icon: 'ruler' },
]

/**
 * Component quản lý danh mục và đơn vị tính sản phẩm
 */
function CategoryManager() {
  const [sub, setSub]             = useState('names')
  const [categories, setCategories] = useState([])
  const [names, setNames]         = useState([])
  const [units, setUnits]         = useState([])
  const [loading, setLoading]     = useState(true)

  const reload = useMemo(() => ({
    categories: () => categoryService.getCategories().then(data => {
      const list = Array.isArray(data) ? data : []
      list.sort((a, b) => (b.id || 0) - (a.id || 0))
      setCategories(list)
      return list
    }).catch(() => {}),
    names: () => categoryService.getProductNames().then(data => {
      const list = Array.isArray(data) ? data : []
      list.sort((a, b) => (b.id || 0) - (a.id || 0))
      setNames(list)
      return list
    }).catch(() => {}),
    units: () => categoryService.getUnitTypes().then(data => {
      const list = Array.isArray(data) ? data : []
      list.sort((a, b) => (b.id || 0) - (a.id || 0))
      setUnits(list)
      return list
    }).catch(() => {}),
  }), [])

  useEffect(() => {
    Promise.all([reload.categories(), reload.names(), reload.units()]).finally(() => setLoading(false))
  }, [reload])

  const catApi = {
    add: (body) => categoryService.createCategory(body).then(saved => {
      if (saved && saved.id) setCategories(prev => [saved, ...prev.filter(x => x.id !== saved.id)])
      return reload.categories()
    }),
    edit: (id, body) => categoryService.updateCategory(id, body).then(saved => {
      if (saved && saved.id) setCategories(prev => [saved, ...prev.filter(x => x.id !== saved.id)])
      return reload.categories()
    }),
    delete: (id) => categoryService.deleteCategory(id).then(() => reload.categories()),
  }

  const nameApi = {
    add: (body) => categoryService.createProductName(body).then(saved => {
      if (saved && saved.id) setNames(prev => [saved, ...prev.filter(x => x.id !== saved.id)])
      return reload.names()
    }),
    edit: (id, body) => categoryService.updateProductName(id, body).then(saved => {
      if (saved && saved.id) setNames(prev => [saved, ...prev.filter(x => x.id !== saved.id)])
      return reload.names()
    }),
    delete: (id) => categoryService.deleteProductName(id).then(() => reload.names()),
  }

  const unitApi = {
    add: (body) => categoryService.createUnitType(body).then(saved => {
      if (saved && saved.id) setUnits(prev => [saved, ...prev.filter(x => x.id !== saved.id)])
      return reload.units()
    }),
    edit: (id, body) => categoryService.updateUnitType(id, body).then(saved => {
      if (saved && saved.id) setUnits(prev => [saved, ...prev.filter(x => x.id !== saved.id)])
      return reload.units()
    }),
    delete: (id) => categoryService.deleteUnitType(id).then(() => reload.units()),
  }

  return (
    <div className="space-y-3">
      <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
        Quản lý danh mục
      </h3>

      <div className="inline-flex p-1 bg-white rounded-2xl border border-stone-200/80 shadow-2xs gap-1">
        {SUB_TABS.map(t => (
          <button
            key={t.key}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              sub === t.key
                ? 'bg-primary text-white shadow-xs'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
            onClick={() => setSub(t.key)}
          >
            <Icon name={t.icon} size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-2.5">
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
