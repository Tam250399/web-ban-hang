import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { contactService } from '../../services/contactService'
import ConfirmModal from '../common/ConfirmModal'

const EMPTY_FORM = { address: '', phone: '', email: '', workingHours: '', isActive: false }

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
      await (isEdit ? contactService.update(item.id, form) : contactService.create(form))
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Thêm thành công!')
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Chỉnh sửa thông tin liên hệ' : '➕ Thêm thông tin liên hệ'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} className="add-product-form">
          <label className="form-field">
            <span>Địa chỉ <span className="required">*</span></span>
            <input value={form.address} onChange={set('address')} required autoFocus placeholder="VD: Khánh Tân, Sài Sơn, Quốc Oai, Hà Nội" />
          </label>
          <label className="form-field">
            <span>Số điện thoại <span className="required">*</span></span>
            <input value={form.phone} onChange={set('phone')} required placeholder="VD: 0901 234 567" />
          </label>
          <label className="form-field">
            <span>Email <span className="required">*</span></span>
            <input type="email" value={form.email} onChange={set('email')} required placeholder="VD: info@vlxdpro.vn" />
          </label>
          <label className="form-field">
            <span>Giờ làm việc <span className="required">*</span></span>
            <input value={form.workingHours} onChange={set('workingHours')} required placeholder="VD: Thứ 2 - Thứ 7: 7:00 - 18:00" />
          </label>
          <label className="toggle-switch">
            <input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-label">{form.isActive ? 'Đang hiển thị trên trang chủ' : 'Đang ẩn'}</span>
          </label>
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

function ContactManager() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [toggling, setToggling] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const load = () => contactService.getAll().then(setItems).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setShowModal(true) }
  const openEdit = (item) => { setEditItem(item); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditItem(null) }
  const handleSaved = () => { closeModal(); load() }

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

  // Chỉ 1 bản ghi được hiển thị cùng lúc — bật cái này thì backend tự tắt các
  // bản ghi khác, nên chỉ cần reload lại danh sách sau khi gọi update.
  const handleToggleActive = async (item) => {
    setToggling(item.id)
    try {
      await contactService.update(item.id, {
        address: item.address,
        phone: item.phone,
        email: item.email,
        workingHours: item.workingHours,
        isActive: !item.isActive,
      })
      load()
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại.')
    }
    setToggling(null)
  }

  return (
    <div>
      <div className="list-header">
        <h3 className="tab-title" style={{ marginBottom: 0 }}>
          Liên hệ với chúng tôi
          <span className="count-badge" style={{ marginLeft: 8 }}>{items.length}</span>
        </h3>
        <button className="btn-primary" onClick={openAdd}>+ Thêm thông tin liên hệ</button>
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Địa chỉ</th><th>SĐT</th><th>Email</th><th>Giờ làm việc</th><th>Hiển thị</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Chưa có thông tin liên hệ nào</td></tr>
            )}
            {items.map((item, i) => (
              <tr key={item.id}>
                <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{i + 1}</td>
                <td>{item.address}</td>
                <td>{item.phone}</td>
                <td>{item.email}</td>
                <td>{item.workingHours}</td>
                <td>
                  <label className="toggle-switch" style={{ opacity: toggling === item.id ? 0.6 : 1 }}>
                    <input
                      type="checkbox"
                      checked={item.isActive}
                      disabled={toggling === item.id}
                      onChange={() => handleToggleActive(item)}
                    />
                    <span className="toggle-track"><span className="toggle-thumb" /></span>
                  </label>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="btn-edit-sm" onClick={() => openEdit(item)}>✏️ Sửa</button>
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
