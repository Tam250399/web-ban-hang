import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { userService } from '../../services/userService'
import Pagination from '../common/Pagination'
import ConfirmModal from '../common/ConfirmModal'

// ---- Phân quyền: danh sách user + đổi vai trò ----
function PermissionTable({ users, roles, currentUser, onChangeRole, onDelete }) {
  const [savingId, setSavingId] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const handleRoleChange = async (userId, roleId) => {
    setSavingId(userId)
    try {
      await onChangeRole(userId, +roleId)
      toast.success('Cập nhật quyền thành công!')
    } catch (err) {
      toast.error(err.message || 'Cập nhật quyền thất bại.')
    }
    setSavingId(null)
  }

  const handleDelete = async () => {
    const id = confirmId
    setConfirmId(null)
    setDeleting(id)
    try {
      await onDelete(id)
      toast.success('Đã xóa người dùng!')
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại.')
    }
    setDeleting(null)
  }

  const filtered = users.filter(u => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return u.username?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phoneNumber?.includes(q)
  })
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="crud-section">
      <h4 className="crud-title">Danh sách người dùng <span className="count-badge">{filtered.length}</span></h4>

      <div className="admin-filter-bar">
        <input
          className="search-input"
          placeholder="Tìm theo tên đăng nhập, họ tên, email, SĐT..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Tên đăng nhập</th><th>Họ tên</th><th>Email</th>
              <th>Số điện thoại</th><th>Vai trò</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                {users.length === 0 ? 'Chưa có người dùng' : 'Không tìm thấy người dùng phù hợp'}
              </td></tr>
            )}
            {paginated.map((u, i) => {
              const isSelf = currentUser?.username === u.username
              return (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.fullName || '-'}</td>
                  <td style={{ color: 'var(--text)', fontSize: '0.88rem' }}>{u.email || '-'}</td>
                  <td style={{ color: 'var(--text)', fontSize: '0.88rem' }}>{u.phoneNumber || '-'}</td>
                  <td>
                    <select
                      className="role-select"
                      value={u.roleId || ''}
                      disabled={savingId === u.id || isSelf}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      title={isSelf ? 'Không thể tự đổi quyền của chính mình' : ''}
                    >
                      {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
                    </select>
                  </td>
                  <td>
                    <div className="action-btns">
                      <button
                        className="btn-danger-sm"
                        disabled={deleting === u.id || isSelf}
                        onClick={() => setConfirmId(u.id)}
                        title={isSelf ? 'Không thể tự xóa chính mình' : ''}
                      >
                        {deleting === u.id ? '...' : '🗑️ Xóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={users.length}
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        label="người dùng"
        onPage={setPage}
      />
      {confirmId && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa người dùng này không?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

function EyeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
      <line x1="3" y1="21" x2="21" y2="3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

// ---- Modal thêm/sửa user ----
function UserFormModal({ user, roles, onSave, onClose }) {
  const isEdit = !!user
  const emptyForm = { username: '', password: 'Abc@123', fullName: '', email: '', phoneNumber: '' }
  const [form, setForm] = useState(
    isEdit
      ? { username: user.username, password: '', fullName: user.fullName || '', email: user.email || '', phoneNumber: user.phoneNumber || '' }
      : emptyForm
  )
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const defaultRoleId = roles.find(r => r.roleName === 'Customer')?.id || roles[0]?.id || ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      if (isEdit) {
        await onSave(user.id, {
          password: form.password,
          fullName: form.fullName,
          email: form.email,
          phoneNumber: form.phoneNumber,
          roleId: user.roleId,
        }, true)
      } else {
        await onSave(null, { ...form, email: form.email ? `${form.email}@gmail.com` : '', roleId: +defaultRoleId }, false)
      }
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
    }
    setLoading(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
        <div className="modal-header">
          <h3>{isEdit ? '✏️ Chỉnh sửa người dùng' : '➕ Đăng ký người dùng mới'}</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="add-product-form" style={{ padding: '20px 24px' }}>
            <label className="form-field">
              <span>Tên đăng nhập <span className="required">*</span></span>
              <input
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                disabled={isEdit}
                placeholder="Nhập tên đăng nhập..."
              />
            </label>
            <label className="form-field">
              <span>Mật khẩu {!isEdit && <span className="required">*</span>}</span>
              <div className="auth-password-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input-password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required={!isEdit}
                  placeholder={isEdit ? 'Để trống nếu không đổi mật khẩu' : 'Nhập mật khẩu...'}
                />
                <button
                  type="button"
                  aria-label="Ẩn hiện mật khẩu"
                  onClick={() => setShowPassword(s => !s)}
                  className="auth-eye-btn"
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </label>
            <label className="form-field">
              <span>Họ tên</span>
              <input
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="Nhập họ tên..."
              />
            </label>
            <div className="form-row">
              <label className="form-field">
                <span>Email</span>
                {isEdit ? (
                  <input
                    type="email"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Nhập email..."
                  />
                ) : (
                  <div className="email-split-input">
                    <input
                      type="text"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="Nhập tên..."
                    />
                    <span className="email-suffix">@gmail.com</span>
                  </div>
                )}
              </label>
              <label className="form-field">
                <span>Số điện thoại</span>
                <input
                  value={form.phoneNumber}
                  onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="Nhập SĐT..."
                />
              </label>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ---- Đăng ký user mới + danh sách user (CRUD đầy đủ) ----
function RegisterUserForm({ users, roles, currentUser, onCreate, onUpdate, onDelete }) {
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [search, setSearch] = useState('')

  const openAdd = () => { setEditUser(null); setShowModal(true) }
  const openEdit = (u) => { setEditUser(u); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditUser(null) }

  const handleSave = async (userId, data, isEdit) => {
    if (isEdit) {
      await onUpdate(userId, data)
      toast.success('Cập nhật người dùng thành công!')
    } else {
      await onCreate(data)
      toast.success('Tạo tài khoản thành công!')
    }
    closeModal()
  }

  const handleDelete = async () => {
    const id = confirmId
    setConfirmId(null)
    setDeleting(id)
    try {
      await onDelete(id)
      toast.success('Đã xóa người dùng!')
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại.')
    }
    setDeleting(null)
  }

  const filtered = users.filter(u => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return u.username?.toLowerCase().includes(q) ||
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phoneNumber?.includes(q)
  })
  const totalPages = Math.ceil(filtered.length / pageSize)
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div>
      <div className="list-header">
        <h4 className="crud-title" style={{ margin: 0 }}>
          Danh sách người dùng <span className="count-badge">{filtered.length}</span>
        </h4>
        <button className="btn-primary" style={{ whiteSpace: 'nowrap' }} onClick={openAdd}>+ Thêm mới</button>
      </div>

      <div className="admin-filter-bar">
        <input
          className="search-input"
          placeholder="Tìm theo tên đăng nhập, họ tên, email, SĐT..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
        />
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Tên đăng nhập</th><th>Họ tên</th><th>Email</th>
              <th>Số điện thoại</th><th>Vai trò</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                {users.length === 0 ? 'Chưa có người dùng' : 'Không tìm thấy người dùng phù hợp'}
              </td></tr>
            )}
            {paginated.map((u, i) => {
              const isSelf = currentUser?.username === u.username
              return (
                <tr key={u.id}>
                  <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{(page - 1) * pageSize + i + 1}</td>
                  <td><strong>{u.username}</strong></td>
                  <td>{u.fullName || '-'}</td>
                  <td style={{ color: 'var(--text)', fontSize: '0.88rem' }}>{u.email || '-'}</td>
                  <td style={{ color: 'var(--text)', fontSize: '0.88rem' }}>{u.phoneNumber || '-'}</td>
                  <td>{u.roleName || '-'}</td>
                  <td>
                    <div className="action-btns">
                      <button className="btn-edit-sm" onClick={() => openEdit(u)}>✏️ Sửa</button>
                      <button
                        className="btn-danger-sm"
                        disabled={deleting === u.id || isSelf}
                        onClick={() => setConfirmId(u.id)}
                        title={isSelf ? 'Không thể tự xóa chính mình' : ''}
                      >
                        {deleting === u.id ? '...' : '🗑️ Xóa'}
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <Pagination
        page={page}
        totalPages={totalPages}
        total={users.length}
        pageSize={pageSize}
        onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
        label="người dùng"
        onPage={setPage}
      />

      {showModal && (
        <UserFormModal
          user={editUser}
          roles={roles}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}

      {confirmId && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa người dùng này không?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

// ---- Main SystemManager ----
const SUB_TABS = [
  { key: 'permissions', label: '🔑 Phân quyền' },
  { key: 'register',    label: '➕ Đăng ký user' },
]

function SystemManager({ currentUser }) {
  const [sub, setSub] = useState('permissions')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])

  const loadUsers = () => userService.getUsers().then(setUsers).catch(() => {})
  const loadRoles = () => userService.getRoles().then(setRoles).catch(() => {})

  useEffect(() => { loadUsers(); loadRoles() }, [])

  const handleChangeRole = (userId, roleId) => userService.updateUserRole(userId, roleId).then(loadUsers)
  const handleDelete = (userId) => userService.deleteUser(userId).then(loadUsers)
  const handleCreate = (data) => userService.createUser(data).then(loadUsers)
  const handleUpdate = (userId, data) => userService.updateUser(userId, data).then(loadUsers)

  return (
    <div>
      <h3 className="tab-title">Hệ thống</h3>

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
        {sub === 'permissions' && (
          <PermissionTable
            users={users}
            roles={roles}
            currentUser={currentUser}
            onChangeRole={handleChangeRole}
            onDelete={handleDelete}
          />
        )}
        {sub === 'register' && (
          <RegisterUserForm
            users={users}
            roles={roles}
            currentUser={currentUser}
            onCreate={handleCreate}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  )
}

export default SystemManager
