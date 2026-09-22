import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { contactService } from '../../services/contactService'
import ConfirmModal from '../common/ConfirmModal'
import { Icon } from '../common/Icon'

const EMPTY_FORM = { address: '', phone: '', email: '', workingHours: '', isActive: false }

/**
 * Component ContactFormModal
 */
function ContactFormModal({ item, onClose, onSaved }) {
  const isEdit = !!item
  const [form, setForm] = useState(item ? {
    address: item.address,
    phone: item.phone,
    email: item.email,
    workingHours: item.workingHours,
    isActive: item.isActive,
  } : EMPTY_FORM)
  const [loading, setLoading] = useState(false)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await (isEdit ? contactService.update(item.id, form) : contactService.create(form))
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Thêm thành công!')
      onSaved(res || { ...form, id: item?.id })
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <Icon name={isEdit ? 'edit' : 'plus'} size={18} className="text-primary" />
            {isEdit ? 'Chỉnh sửa thông tin liên hệ' : 'Thêm thông tin liên hệ'}
          </h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer text-sm font-bold" onClick={onClose} aria-label="Đóng">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="block text-xs sm:text-sm font-semibold text-stone-700">
            <span>Địa chỉ <span className="text-red-500">*</span></span>
            <input
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              value={form.address}
              onChange={set('address')}
              required
              autoFocus
              placeholder="VD: Khánh Tân, Sài Sơn, Quốc Oai, Hà Nội"
            />
          </label>
          <label className="block text-xs sm:text-sm font-semibold text-stone-700">
            <span>Số điện thoại <span className="text-red-500">*</span></span>
            <input
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              value={form.phone}
              onChange={set('phone')}
              required
              placeholder="VD: 0901 234 567"
            />
          </label>
          <label className="block text-xs sm:text-sm font-semibold text-stone-700">
            <span>Email <span className="text-red-500">*</span></span>
            <input
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              type="email"
              value={form.email}
              onChange={set('email')}
              required
              placeholder="VD: info@vlxdpro.vn"
            />
          </label>
          <label className="block text-xs sm:text-sm font-semibold text-stone-700">
            <span>Giờ làm việc <span className="text-red-500">*</span></span>
            <input
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              value={form.workingHours}
              onChange={set('workingHours')}
              required
              placeholder="VD: Thứ 2 - Thứ 7: 7:00 - 18:00"
            />
          </label>
          <label className="inline-flex items-center gap-3 cursor-pointer py-1 select-none">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            <span className="text-xs sm:text-sm font-bold text-stone-800">{form.isActive ? 'Đang hiển thị trên trang chủ' : 'Đang ẩn'}</span>
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
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Component quản lý thông tin liên hệ của cửa hàng
 */
function ContactManager() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const load = () => contactService.getAll().then(data => {
    const list = Array.isArray(data) ? data : []
    list.sort((a, b) => (b.isActive ? 1 : 0) - (a.isActive ? 1 : 0) || (b.id || 0) - (a.id || 0))
    setItems(list)
  }).catch(() => {}).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setShowModal(true) }
  const openEdit = (item) => { setEditItem(item); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditItem(null) }
  const handleSaved = (saved) => {
    closeModal()
    if (saved && saved.id) {
      setItems(prev => [saved, ...prev.filter(x => x.id !== saved.id)])
    }
    load()
  }

  const handleDelete = async () => {
    const id = confirmId
    setConfirmId(null)
    setDeleting(id)
    try {
      await contactService.delete(id)
      toast.success('Đã xóa!')
      load()
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại.')
    }
    setDeleting(null)
  }

  const handleToggleActive = async (item) => {
    const turningOn = !item.isActive
    setToggling(item.id)
    try {
      await contactService.update(item.id, { ...item, isActive: turningOn })
      if (turningOn) toast.success('Đã hiển thị thông tin này trên trang chủ, các thông tin khác tự động ẩn.')
      load()
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại.')
    }
    setToggling(null)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
          Liên hệ với chúng tôi
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {items.length}
          </span>
        </h3>
        <button
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer"
          onClick={openAdd}
        >
          <Icon name="plus" size={16} /> Thêm thông tin liên hệ
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="px-3.5 py-2.5">#</th>
              <th className="px-3.5 py-2.5">Địa chỉ</th>
              <th className="px-3.5 py-2.5">SĐT</th>
              <th className="px-3.5 py-2.5">Email</th>
              <th className="px-3.5 py-2.5">Giờ làm việc</th>
              <th className="px-3.5 py-2.5">Hiển thị</th>
              <th className="px-3.5 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {loading && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-stone-400 text-xs sm:text-sm">Đang tải...</td>
              </tr>
            )}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-stone-400 text-xs sm:text-sm">Chưa có thông tin liên hệ nào</td>
              </tr>
            )}
            {!loading && items.map((item, i) => (
              <tr key={item.id} className={`hover:bg-stone-50/60 transition ${deleting === item.id ? 'opacity-50' : ''}`}>
                <td className="px-3.5 py-2 text-stone-400 text-xs">{i + 1}</td>
                <td className="px-3.5 py-2 font-bold text-stone-900">{item.address}</td>
                <td className="px-3.5 py-2 text-stone-700">{item.phone}</td>
                <td className="px-3.5 py-2 text-stone-600">{item.email}</td>
                <td className="px-3.5 py-2 text-stone-600">{item.workingHours}</td>
                <td className="px-3.5 py-2">
                  <label className={`inline-flex items-center gap-2 cursor-pointer select-none ${toggling === item.id ? 'opacity-60 pointer-events-none' : ''}`}>
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      disabled={toggling === item.id}
                      onChange={() => handleToggleActive(item)}
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary" />
                    <span className="text-[11px] font-bold text-stone-600">{item.isActive ? 'Đang hiển thị' : 'Đang ẩn'}</span>
                  </label>
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

      {showModal && (
        <ContactFormModal
          item={editItem}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

      {confirmId && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa thông tin liên hệ này không?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

export default ContactManager
