import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { bannerService } from '../../services/bannerService'
import { uploadImage } from '../../services/uploadService'
import ConfirmModal from '../common/ConfirmModal'

const EMPTY_FORM = { title: '', description: '', imageUrl: '', displayOrder: 0, isActive: true }

function BannerManager() {
  const [banners, setBanners] = useState([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)
  const fileInputRef = useRef(null)

  const load = () => bannerService.getAll().then(setBanners).catch(() => {})
  useEffect(() => { load() }, [])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const reset = () => {
    setForm(EMPTY_FORM)
    setEditId(null)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const startEdit = (b) => {
    setEditId(b.id)
    setForm({
      title: b.title,
      description: b.description || '',
      imageUrl: b.imageUrl,
      displayOrder: b.displayOrder,
      isActive: b.isActive,
    })
    setImagePreview(b.imageUrl)
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setImagePreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      const url = await uploadImage(file)
      setForm(f => ({ ...f, imageUrl: url }))
      toast.success('Tải ảnh lên thành công!')
    } catch (err) {
      toast.error(err.message || 'Tải ảnh thất bại.')
      setImagePreview(null)
    }
    setUploading(false)
  }

  const removeImage = () => {
    setImagePreview(null)
    setForm(f => ({ ...f, imageUrl: '' }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.imageUrl) { toast.error('Vui lòng chọn ảnh cho banner.'); return }
    setLoading(true)
    const payload = { ...form, displayOrder: +form.displayOrder || 0 }
    try {
      await (editId ? bannerService.update(editId, payload) : bannerService.create(payload))
      toast.success(editId ? 'Cập nhật thành công!' : 'Thêm banner thành công!')
      reset()
      load()
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
    }
    setLoading(false)
  }

  const handleDelete = async () => {
    const id = confirmId
    setConfirmId(null)
    setDeleting(id)
    try {
      await bannerService.delete(id)
      toast.success('Đã xóa banner!')
      load()
    } catch (err) {
      toast.error(err.message || 'Xóa thất bại.')
    }
    setDeleting(null)
  }

  return (
    <div>
      <h3 className="tab-title">Quản lý banner trang chủ</h3>
      <div className="crud-layout">
        <div className="form-card" style={{ minWidth: 300 }}>
          <h5 style={{ margin: '0 0 14px', fontWeight: 700 }}>
            {editId ? '✏️ Chỉnh sửa banner' : '➕ Thêm banner mới'}
          </h5>
          <form onSubmit={handleSubmit} className="add-product-form">
            <label className="form-field">
              <span>Tiêu đề <span className="required">*</span></span>
              <input value={form.title} onChange={set('title')} required placeholder="VD: Khuyến mãi xi măng tháng này" />
            </label>

            <label className="form-field">
              <span>Mô tả</span>
              <input value={form.description} onChange={set('description')} placeholder="Mô tả ngắn hiển thị trên banner..." />
            </label>

            <div className="form-row">
              <label className="form-field">
                <span>Thứ tự hiển thị</span>
                <input type="number" value={form.displayOrder} onChange={set('displayOrder')} min="0" />
              </label>
              <label className="form-field">
                <span>Trạng thái</span>
                <select value={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}>
                  <option value="true">Hiển thị</option>
                  <option value="false">Ẩn</option>
                </select>
              </label>
            </div>

            <div className="form-field">
              <span>Ảnh banner <span className="required">*</span></span>
              {imagePreview ? (
                <div className="image-upload-preview">
                  <img src={imagePreview} alt="preview" />
                  {uploading && <div className="image-upload-overlay">Đang tải...</div>}
                  {!uploading && (
                    <button type="button" className="image-remove-btn" onClick={removeImage}>✕</button>
                  )}
                </div>
              ) : (
                <label className={`image-upload-zone ${uploading ? 'uploading' : ''}`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    style={{ display: 'none' }}
                    disabled={uploading}
                  />
                  <span className="image-upload-icon">🖼️</span>
                  <span>{uploading ? 'Đang tải lên...' : 'Nhấn để chọn ảnh'}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>JPG, PNG, WEBP, GIF · Tối đa 5MB</span>
                </label>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn-primary" type="submit" disabled={loading || uploading} style={{ flex: 1 }}>
                {loading ? '...' : editId ? 'Lưu' : 'Thêm banner'}
              </button>
              {editId && <button type="button" className="btn-ghost" onClick={reset}>Hủy</button>}
            </div>
          </form>
        </div>

        <div style={{ flex: 1 }}>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>#</th><th>Ảnh</th><th>Tiêu đề</th><th>Thứ tự</th><th>Trạng thái</th><th>Thao tác</th></tr>
              </thead>
              <tbody>
                {banners.length === 0 && (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 24 }}>Chưa có banner nào</td></tr>
                )}
                {banners.map((b, i) => (
                  <tr key={b.id} className={editId === b.id ? 'editing-row' : ''}>
                    <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{i + 1}</td>
                    <td><img src={b.imageUrl} alt={b.title} style={{ width: 64, height: 40, objectFit: 'cover', borderRadius: 6 }} /></td>
                    <td><strong>{b.title}</strong></td>
                    <td>{b.displayOrder}</td>
                    <td>{b.isActive ? <span style={{ color: 'var(--success)' }}>Hiển thị</span> : <span style={{ color: 'var(--text)' }}>Ẩn</span>}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-edit-sm" onClick={() => startEdit(b)}>✏️ Sửa</button>
                        <button className="btn-danger-sm" onClick={() => setConfirmId(b.id)} disabled={deleting === b.id}>
                          {deleting === b.id ? '...' : '🗑️ Xóa'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {confirmId && (
        <ConfirmModal
          message="Bạn có chắc muốn xóa banner này không?"
          onConfirm={handleDelete}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </div>
  )
}

export default BannerManager
