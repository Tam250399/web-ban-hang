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

  const totalPages = Math.ceil(users.length / pageSize)
  const paginated = users.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="crud-section">
      <h4 className="crud-title">Danh sách người dùng</h4>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th><th>Tên đăng nhập</th><th>Họ tên</th><th>Email</th>
              <th>Số điện thoại</th><th>Vai trò</th><th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Chưa có người dùng</td></tr>
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

// ---- Đăng ký user mới (admin tạo, chọn vai trò) ----
function RegisterUserForm({ roles, onCreate }) {
  const emptyForm = { username: '', password: '', fullName: '', email: '', phoneNumber: '', roleId: '' }
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (roles.length && !form.roleId) {
      setForm(f => ({ ...f, roleId: String(roles.find(r => r.roleName === 'Customer')?.id || roles[0].id) }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onCreate({ ...form, roleId: +form.roleId })
      toast.success('Tạo tài khoản thành công!')
      setForm(f => ({ ...emptyForm, roleId: f.roleId }))
    } catch (err) {
      toast.error(err.message || 'Tạo tài khoản thất bại.')
    }
    setLoading(false)
  }

  return (
    <div className="form-card" style={{ maxWidth: 420 }}>
      <h5 style={{ margin: '0 0 14px', fontWeight: 700 }}>➕ Đăng ký người dùng mới</h5>
      <form onSubmit={handleSubmit} className="add-product-form">
        <label className="form-field">
          <span>Tên đăng nhập <span className="required">*</span></span>
          <input
            value={form.username}
            onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
            required
            placeholder="Nhập tên đăng nhập..."
          />
        </label>
        <label className="form-field">
          <span>Mật khẩu <span className="required">*</span></span>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            required
            placeholder="Nhập mật khẩu..."
          />
        </label>
        <label className="form-field">
          <span>Họ tên</span>
          <input
            value={form.fullName}
            onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
            placeholder="Nhập họ tên..."
          />
        </label>
        <label className="form-field">
          <span>Email</span>
          <input
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            placeholder="Nhập email..."
          />
        </label>
        <label className="form-field">
          <span>Số điện thoại</span>
          <input
            value={form.phoneNumber}
            onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
            placeholder="Nhập số điện thoại..."
          />
        </label>
        <label className="form-field">
          <span>Vai trò <span className="required">*</span></span>
          <select value={form.roleId} onChange={e => setForm(f => ({ ...f, roleId: e.target.value }))} required>
            {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
          </select>
        </label>
        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? '...' : 'Tạo tài khoản'}
        </button>
      </form>
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
          <RegisterUserForm roles={roles} onCreate={handleCreate} />
        )}
      </div>
    </div>
  )
}

export default SystemManager
