import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { customerService } from '../../services/customerService'
import Pagination from '../common/Pagination'
import ConfirmModal from '../common/ConfirmModal'
import { Icon } from '../common/Icon'

const EMPTY_FORM = { fullName: '', phoneNumber: '', address: '', isBusiness: false }

/**
 * Component CustomerModal
 */
function CustomerModal({ customer, onClose, onSaved }) {
  const isEdit = !!customer
  const [form, setForm] = useState(customer ? {
    fullName: customer.fullName,
    phoneNumber: customer.phoneNumber,
    address: customer.address || '',
    isBusiness: customer.isBusiness,
  } : EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await (isEdit ? customerService.update(customer.id, form) : customerService.create(form))
      toast.success(isEdit ? 'Cập nhật khách hàng thành công!' : 'Thêm khách hàng thành công!')
      onSaved(res || { ...form, id: customer?.id, createdAt: new Date().toISOString() })
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base sm:text-lg font-black text-stone-900">{isEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}</h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer text-sm font-bold" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="inline-flex items-center gap-3 cursor-pointer py-1 select-none">
            <input
              type="checkbox"
              checked={form.isBusiness}
              onChange={e => setForm(f => ({ ...f, isBusiness: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            <span className="text-xs sm:text-sm font-bold text-stone-800">{form.isBusiness ? 'Khách hàng Doanh nghiệp' : 'Khách hàng Cá nhân'}</span>
          </label>

          <label className="block text-xs sm:text-sm font-semibold text-stone-700">
            <span>Họ tên <span className="text-red-500">*</span></span>
            <input
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              value={form.fullName}
              onChange={set('fullName')}
              required
              autoFocus
              placeholder="Nhập họ tên khách hàng..."
            />
          </label>

          <label className="block text-xs sm:text-sm font-semibold text-stone-700">
            <span>Số điện thoại <span className="text-red-500">*</span></span>
            <input
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              type="tel"
              value={form.phoneNumber}
              onChange={set('phoneNumber')}
              required
              placeholder="VD: 0901234567"
            />
          </label>

          <label className="block text-xs sm:text-sm font-semibold text-stone-700">
            <span>Địa chỉ</span>
            <input
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              value={form.address}
              onChange={set('address')}
              placeholder="Địa chỉ..."
            />
          </label>

          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs sm:text-sm transition cursor-pointer"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Component quản lý hồ sơ khách hàng
 */
function CustomerManager() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const load = () => customerService.getAll().then(data => {
    const list = Array.isArray(data) ? data : []
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0))
    setCustomers(list)
  }).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditingCustomer(null); setShowModal(true) }
  const openEdit = (c) => { setEditingCustomer(c); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditingCustomer(null) }
  const handleSaved = (saved) => {
    closeModal()
    setPage(1)
    if (saved && saved.id) {
      setCustomers(prev => [saved, ...prev.filter(c => c.id !== saved.id)])
    }
    load()
  }

  const handleDelete = async () => {
    const id = confirmId
    setConfirmId(null)
    setDeleting(id)
    try {
      await customerService.remove(id)
      toast.success('Đã xóa khách hàng!')
      load()
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại.')
    }
    setDeleting(null)
  }

  const sorted = [...customers].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0))
  const filtered = sorted.filter(c => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return c.fullName?.toLowerCase().includes(q) || c.phoneNumber?.includes(q)
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
          Quản lý khách hàng
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {filtered.length}
          </span>
        </h3>
        <button
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer"
          onClick={openAdd}
        >
          <Icon name="plus" size={15} /> Thêm khách hàng
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 bg-white p-2.5 sm:p-3 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[220px]">
          <Icon name="search" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full pl-9 pr-3.5 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            placeholder="Tìm theo họ tên hoặc số điện thoại..."
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
              <th className="px-3.5 py-2.5">Họ tên</th>
              <th className="px-3.5 py-2.5">Số điện thoại</th>
              <th className="px-3.5 py-2.5">Địa chỉ</th>
              <th className="px-3.5 py-2.5">Loại</th>
              <th className="px-3.5 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {paginated.map((c, i) => (
              <tr key={c.id} className="hover:bg-stone-50/60 transition">
                <td className="px-3.5 py-2 text-stone-400 text-xs">{(page - 1) * pageSize + i + 1}</td>
                <td className="px-3.5 py-2 font-bold text-stone-900">{c.fullName}</td>
                <td className="px-3.5 py-2 text-stone-700">{c.phoneNumber}</td>
                <td className="px-3.5 py-2 text-stone-600">{c.address || '-'}</td>
                <td className="px-3.5 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    c.isBusiness
                      ? 'bg-blue-50 text-blue-700 border-blue-200'
                      : 'bg-stone-100 text-stone-700 border-stone-200'
                  }`}>
                    {c.isBusiness ? 'Doanh nghiệp' : 'Cá nhân'}
                  </span>
                </td>
                <td className="px-3.5 py-2 text-right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer border border-amber-200/60"
                      onClick={() => openEdit(c)}
                    >
                      <Icon name="edit" size={13} /> Sửa
                    </button>
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer border border-red-200/60 disabled:opacity-50"
                      onClick={() => setConfirmId(c.id)}
                      disabled={deleting === c.id}
                    >
                      {deleting === c.id ? '...' : <><Icon name="trash" size={13} /> Xóa</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-stone-400 text-xs sm:text-sm">
                  {customers.length === 0 ? 'Chưa có khách hàng nào' : 'Không tìm thấy khách hàng phù hợp'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        total={filtered.length}
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        label="khách hàng"
        onPage={setPage}
      />

      {showModal && (
        <CustomerModal
          customer={editingCustomer}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {confirmId && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa khách hàng này không?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

export default CustomerManager
