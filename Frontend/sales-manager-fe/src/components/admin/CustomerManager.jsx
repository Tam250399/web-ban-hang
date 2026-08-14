import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { customerService } from '../../services/customerService'
import Pagination from '../common/Pagination'
import ConfirmModal from '../common/ConfirmModal'

const EMPTY_FORM = { fullName: '', phoneNumber: '', address: '', isBusiness: false }

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
      await (isEdit ? customerService.update(customer.id, form) : customerService.create(form))
      toast.success(isEdit ? 'Cập nhật khách hàng thành công!' : 'Thêm khách hàng thành công!')
      onSaved()
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="add-product-form">
          <label className="toggle-switch">
            <input type="checkbox" checked={form.isBusiness} onChange={e => setForm(f => ({ ...f, isBusiness: e.target.checked }))} />
            <span className="toggle-track"><span className="toggle-thumb" /></span>
            <span className="toggle-label">{form.isBusiness ? 'Doanh nghiệp' : 'Cá nhân'}</span>
          </label>

          <label className="form-field">
            <span>Họ tên <span className="required">*</span></span>
            <input value={form.fullName} onChange={set('fullName')} required autoFocus placeholder="Nhập họ tên khách hàng..." />
          </label>

          <label className="form-field">
            <span>Số điện thoại <span className="required">*</span></span>
            <input type="tel" value={form.phoneNumber} onChange={set('phoneNumber')} required placeholder="VD: 0901234567" />
          </label>

          <label className="form-field">
            <span>Địa chỉ</span>
            <input value={form.address} onChange={set('address')} placeholder="Địa chỉ..." />
          </label>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm khách hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CustomerManager() {
  const [customers, setCustomers] = useState([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const load = () => customerService.getAll().then(setCustomers).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditingCustomer(null); setShowModal(true) }
  const openEdit = (c) => { setEditingCustomer(c); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditingCustomer(null) }
  const handleSaved = () => { closeModal(); setPage(1); load() }

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

  const filtered = customers.filter(c => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return c.fullName?.toLowerCase().includes(q) || c.phoneNumber?.includes(q)
  })

  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div>
      <div className="list-header">
        <h3 className="tab-title" style={{ marginBottom: 0 }}>
          Quản lý khách hàng
          <span className="count-badge" style={{ marginLeft: 8 }}>{filtered.length}</span>
        </h3>
        <button className="btn-primary" onClick={openAdd}>+ Thêm khách hàng</button>
      </div>

      <div className="admin-filter-bar">
        <input
          className="search-input"
          placeholder="Tìm theo họ tên hoặc số điện thoại..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>#</th><th>Họ tên</th><th>Số điện thoại</th><th>Địa chỉ</th><th>Loại</th><th>Thao tác</th></tr>
          </thead>
          <tbody>
            {paginated.map((c, i) => (
              <tr key={c.id}>
                <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                <td><strong>{c.fullName}</strong></td>
                <td>{c.phoneNumber}</td>
                <td>{c.address || '-'}</td>
                <td>
                  <span className={`customer-badge ${c.isBusiness ? 'business' : 'personal'}`}>
                    {c.isBusiness ? 'Doanh nghiệp' : 'Cá nhân'}
                  </span>
                </td>
                <td>
                  <div className="action-btns">
                    <button className="btn-edit-sm" onClick={() => openEdit(c)}>✏️ Sửa</button>
                    <button className="btn-danger-sm" onClick={() => setConfirmId(c.id)} disabled={deleting === c.id}>
                      {deleting === c.id ? '...' : '🗑️ Xóa'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-light)', padding: 24 }}>
                {customers.length === 0 ? 'Chưa có khách hàng nào' : 'Không tìm thấy khách hàng phù hợp'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page} totalPages={totalPages} total={filtered.length} pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        label="khách hàng" onPage={setPage}
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
