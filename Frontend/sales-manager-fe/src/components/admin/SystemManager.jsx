import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { userService } from '../../services/userService'
import Pagination from '../common/Pagination'
import ConfirmModal from '../common/ConfirmModal'
import { Icon } from '../common/Icon'

/**
 * Component PermissionTable
 */
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

  const sorted = [...users].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0))
  const filtered = sorted.filter(u => {
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
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
          Danh sách người dùng
          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {filtered.length}
          </span>
        </h4>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full pl-10 pr-4 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            placeholder="Tìm theo tên đăng nhập, họ tên, email, SĐT..."
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
              <th className="px-3.5 py-2.5">Tên đăng nhập</th>
              <th className="px-3.5 py-2.5">Họ tên</th>
              <th className="px-3.5 py-2.5">Email</th>
              <th className="px-3.5 py-2.5">Số điện thoại</th>
              <th className="px-3.5 py-2.5">Vai trò</th>
              <th className="px-3.5 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-stone-400 text-xs sm:text-sm">
                {users.length === 0 ? 'Chưa có người dùng' : 'Không tìm thấy người dùng phù hợp'}
              </td></tr>
            )}
            {paginated.map((u, i) => {
              const isSelf = currentUser?.username === u.username
              return (
                <tr key={u.id} className={`hover:bg-stone-50/60 transition ${deleting === u.id ? 'opacity-50' : ''}`}>
                  <td className="px-3.5 py-2 text-stone-400 text-xs">{(page - 1) * pageSize + i + 1}</td>
                  <td className="px-3.5 py-2 font-bold text-stone-900 font-mono">{u.username}</td>
                  <td className="px-3.5 py-2 text-stone-800">{u.fullName || '-'}</td>
                  <td className="px-3.5 py-2 text-stone-600">{u.email || '-'}</td>
                  <td className="px-3.5 py-2 text-stone-600">{u.phoneNumber || '-'}</td>
                  <td className="px-3.5 py-2">
                    <select
                      className="px-2 py-1 rounded-lg border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-50 cursor-pointer"
                      value={u.roleId || ''}
                      disabled={savingId === u.id || isSelf}
                      onChange={e => handleRoleChange(u.id, e.target.value)}
                      title={isSelf ? 'Không thể tự đổi quyền của chính mình' : ''}
                    >
                      {roles.map(r => <option key={r.id} value={r.id}>{r.roleName}</option>)}
                    </select>
                  </td>
                  <td className="px-3.5 py-2 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={deleting === u.id || isSelf}
                        onClick={() => setConfirmId(u.id)}
                        title={isSelf ? 'Không thể tự xóa chính mình' : ''}
                      >
                        {deleting === u.id ? '...' : <><Icon name="trash" size={13} /> Xóa</>}
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

/**
 * Component UserFormModal
 */
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
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <Icon name={isEdit ? 'edit' : 'plus'} size={18} className="text-primary" /> {isEdit ? 'Chỉnh sửa người dùng' : 'Đăng ký người dùng mới'}
          </h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer text-sm font-bold" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <label className="block text-xs sm:text-sm font-semibold text-stone-700">
              <span>Tên đăng nhập <span className="text-red-500">*</span></span>
              <input
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition disabled:bg-stone-100 disabled:text-stone-500 font-mono"
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                required
                disabled={isEdit}
                placeholder="Nhập tên đăng nhập..."
              />
            </label>
            <label className="block text-xs sm:text-sm font-semibold text-stone-700">
              <span>Mật khẩu {!isEdit && <span className="text-red-500">*</span>}</span>
              <div className="relative mt-1.5 flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="w-full px-3.5 py-2 pr-10 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required={!isEdit}
                  placeholder={isEdit ? 'Để trống nếu không đổi mật khẩu' : 'Nhập mật khẩu...'}
                />
                <button
                  type="button"
                  aria-label="Ẩn hiện mật khẩu"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                </button>
              </div>
            </label>
            <label className="block text-xs sm:text-sm font-semibold text-stone-700">
              <span>Họ tên</span>
              <input
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                placeholder="Nhập họ tên..."
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                <span>Email</span>
                {isEdit ? (
                  <input
                    type="email"
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="Nhập email..."
                  />
                ) : (
                  <div className="relative mt-1.5 flex items-center">
                    <input
                      type="text"
                      className="w-full px-3.5 py-2 pr-24 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                      value={form.email}
                      onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="Nhập tên..."
                    />
                    <span className="absolute right-2.5 text-xs text-stone-400 font-medium select-none pointer-events-none">@gmail.com</span>
                  </div>
                )}
              </label>
              <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                <span>Số điện thoại</span>
                <input
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  value={form.phoneNumber}
                  onChange={e => setForm(f => ({ ...f, phoneNumber: e.target.value }))}
                  placeholder="Nhập SĐT..."
                />
              </label>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-3">
            <button type="button" className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-bold text-xs sm:text-sm transition cursor-pointer" onClick={onClose}>Hủy</button>
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer disabled:opacity-50"
              type="submit"
              disabled={loading}
            >
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Component RegisterUserForm
 */
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

  const handleSave = async (id, data, isEdit) => {
    await (isEdit ? onUpdate(id, data) : onCreate(data))
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
      toast.success('Đã xóa người dùng!')
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại.')
    }
    setDeleting(null)
  }

  const sorted = [...users].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0))
  const filtered = sorted.filter(u => {
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
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h4 className="text-base sm:text-lg font-black text-stone-900 tracking-tight flex items-center gap-2">
          Danh sách người dùng
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
            placeholder="Tìm theo tên đăng nhập, họ tên, email, SĐT..."
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
              <th className="px-3.5 py-2.5">Tên đăng nhập</th>
              <th className="px-3.5 py-2.5">Họ tên</th>
              <th className="px-3.5 py-2.5">Email</th>
              <th className="px-3.5 py-2.5">Số điện thoại</th>
              <th className="px-3.5 py-2.5">Vai trò</th>
              <th className="px-3.5 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center py-12 text-stone-400 text-xs sm:text-sm">
                {users.length === 0 ? 'Chưa có người dùng' : 'Không tìm thấy người dùng phù hợp'}
              </td></tr>
            )}
            {paginated.map((u, i) => {
              const isSelf = currentUser?.username === u.username
              return (
                <tr key={u.id} className={`hover:bg-stone-50/60 transition ${deleting === u.id ? 'opacity-50' : ''}`}>
                  <td className="px-3.5 py-2 text-stone-400 text-xs">{(page - 1) * pageSize + i + 1}</td>
                  <td className="px-3.5 py-2 font-bold text-stone-900 font-mono">{u.username}</td>
                  <td className="px-3.5 py-2 text-stone-800">{u.fullName || '-'}</td>
                  <td className="px-3.5 py-2 text-stone-600">{u.email || '-'}</td>
                  <td className="px-3.5 py-2 text-stone-600">{u.phoneNumber || '-'}</td>
                  <td className="px-3.5 py-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                      {u.roleName || '-'}
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-right">
                    <div className="inline-flex items-center gap-1.5 justify-end">
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer border border-amber-200/60"
                        onClick={() => openEdit(u)}
                      >
                        <Icon name="edit" size={13} /> Sửa
                      </button>
                      <button
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer border border-red-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        disabled={deleting === u.id || isSelf}
                        onClick={() => setConfirmId(u.id)}
                        title={isSelf ? 'Không thể tự xóa chính mình' : ''}
                      >
                        {deleting === u.id ? '...' : <><Icon name="trash" size={13} /> Xóa</>}
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

const SUB_TABS = [
  { key: 'permissions', label: 'Phân quyền', icon: 'key' },
  { key: 'register',    label: 'Đăng ký user', icon: 'plus' },
]

/**
 * Component quản lý cài đặt hệ thống
 */
function SystemManager({ currentUser }) {
  const [sub, setSub] = useState('permissions')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])

  const loadUsers = () => userService.getUsers().then(data => {
    const list = Array.isArray(data) ? data : []
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0))
    setUsers(list)
  }).catch(() => {})
  const loadRoles = () => userService.getRoles().then(setRoles).catch(() => {})

  useEffect(() => { loadUsers(); loadRoles() }, [])

  const handleChangeRole = (userId, roleId) => userService.updateUserRole(userId, roleId).then(loadUsers)
  const handleDelete = (userId) => userService.deleteUser(userId).then(loadUsers)
  const handleCreate = (data) => userService.createUser(data).then(saved => {
    if (saved && saved.id) setUsers(prev => [saved, ...prev.filter(u => u.id !== saved.id)])
    return loadUsers()
  })
  const handleUpdate = (userId, data) => userService.updateUser(userId, data).then(saved => {
    if (saved && saved.id) setUsers(prev => [saved, ...prev.filter(u => u.id !== saved.id)])
    return loadUsers()
  })

  return (
    <div className="space-y-3">
      <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">Hệ thống</h3>

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
