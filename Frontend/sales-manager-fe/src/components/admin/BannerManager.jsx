import { useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { bannerService } from '../../services/bannerService'
import { uploadImage } from '../../services/uploadService'
import ConfirmModal from '../common/ConfirmModal'
import { resolveMediaUrl } from '../../services/config'
import { Icon } from '../common/Icon'
import OptimizedImage from '../common/OptimizedImage'

const EMPTY_FORM = { title: '', description: '', imageUrl: '', displayOrder: 0, isActive: true }

/**
 * Component BannerModal
 */
function BannerModal({ banner, onClose, onSaved }) {
  const isEdit = !!banner
  const [form, setForm] = useState(banner ? {
    title: banner.title,
    description: banner.description || '',
    imageUrl: banner.imageUrl,
    displayOrder: banner.displayOrder,
    isActive: banner.isActive,
  } : EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(banner?.imageUrl ? resolveMediaUrl(banner.imageUrl) : null)
  const fileInputRef = useRef(null)

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

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
      const res = await (isEdit ? bannerService.update(banner.id, payload) : bannerService.create(payload))
      toast.success(isEdit ? 'Cập nhật thành công!' : 'Thêm banner thành công!')
      onSaved(res || { ...payload, id: banner?.id, createdAt: new Date().toISOString() })
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <Icon name="image" size={18} className="text-primary" />
            {isEdit ? 'Chỉnh sửa banner' : 'Thêm banner mới'}
          </h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer text-sm font-bold" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <label className="block text-xs sm:text-sm font-semibold text-stone-700">
            <span>Tiêu đề <span className="text-red-500">*</span></span>
            <input
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              value={form.title}
              onChange={set('title')}
              required
              autoFocus
              placeholder="VD: Khuyến mãi xi măng tháng này"
            />
          </label>

          <label className="block text-xs sm:text-sm font-semibold text-stone-700">
            <span>Mô tả</span>
            <input
              className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              value={form.description}
              onChange={set('description')}
              placeholder="Mô tả ngắn hiển thị trên banner..."
            />
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="block text-xs sm:text-sm font-semibold text-stone-700">
              <span>Thứ tự hiển thị</span>
              <input
                type="number"
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                value={form.displayOrder}
                onChange={set('displayOrder')}
                min="0"
              />
            </label>
            <label className="block text-xs sm:text-sm font-semibold text-stone-700">
              <span>Trạng thái</span>
              <select
                className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                value={form.isActive}
                onChange={e => setForm(f => ({ ...f, isActive: e.target.value === 'true' }))}
              >
                <option value="true">Hiển thị</option>
                <option value="false">Ẩn</option>
              </select>
            </label>
          </div>

          <div className="block text-xs sm:text-sm font-semibold text-stone-700">
            <span>Ảnh banner <span className="text-red-500">*</span></span>
            <div className="mt-1.5">
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-[21/9] bg-stone-50 flex items-center justify-center group">
                  <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  {uploading && (
                    <div className="absolute inset-0 bg-stone-900/60 text-white flex items-center justify-center text-xs font-bold backdrop-blur-2xs">
                      Đang tải...
                    </div>
                  )}
                  {!uploading && (
                    <button
                      type="button"
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-stone-900/75 hover:bg-stone-900 text-white flex items-center justify-center text-xs font-bold transition shadow-sm cursor-pointer"
                      onClick={removeImage}
                      aria-label="Xoá ảnh"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : (
                <label className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition min-h-[140px] ${
                  uploading ? 'border-primary bg-primary/5 opacity-70 pointer-events-none' : 'border-stone-300 hover:border-primary bg-stone-50/50 hover:bg-stone-50'
                }`}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageChange}
                    className="sr-only"
                    disabled={uploading}
                  />
                  <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-stone-200/60 flex items-center justify-center text-stone-400 mb-1.5">
                    <Icon name="image" size={20} />
                  </div>
                  <span className="text-xs font-bold text-stone-800">{uploading ? 'Đang tải lên...' : 'Nhấn để chọn ảnh banner'}</span>
                  <span className="text-[11px] text-stone-400 mt-0.5">JPG, PNG, WEBP, GIF · Tối đa 5MB</span>
                </label>
              )}
            </div>
          </div>

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
              disabled={loading || uploading}
            >
              {loading ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm banner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * Component quản lý danh sách banner quảng cáo
 */
function BannerManager() {
  const [banners, setBanners] = useState([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingBanner, setEditingBanner] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [confirmId, setConfirmId] = useState(null)

  const load = () => bannerService.getAll().then(data => {
    const list = Array.isArray(data) ? data : []
    list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0))
    setBanners(list)
  }).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditingBanner(null); setShowModal(true) }
  const openEdit = (b) => { setEditingBanner(b); setShowModal(true) }
  const closeModal = () => { setShowModal(false); setEditingBanner(null) }
  const handleSaved = (saved) => {
    closeModal()
    if (saved && saved.id) {
      setBanners(prev => [saved, ...prev.filter(b => b.id !== saved.id)])
    }
    load()
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

  const sorted = [...banners].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0) || (b.id || 0) - (a.id || 0))
  const filtered = sorted.filter(b => b.title?.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2.5">
          Quản lý banner trang chủ
          <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
            {filtered.length}
          </span>
        </h3>
        <button
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition cursor-pointer"
          onClick={openAdd}
        >
          <Icon name="plus" size={16} /> Thêm banner
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-stone-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[240px]">
          <Icon name="search" size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            className="w-full pl-10 pr-4 py-1.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            placeholder="Tìm theo tiêu đề banner..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-2xs overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="bg-stone-50/80 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="px-3.5 py-2.5">#</th>
              <th className="px-3.5 py-2.5">Ảnh</th>
              <th className="px-3.5 py-2.5">Tiêu đề</th>
              <th className="px-3.5 py-2.5">Thứ tự</th>
              <th className="px-3.5 py-2.5">Trạng thái</th>
              <th className="px-3.5 py-2.5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-stone-400 text-xs sm:text-sm">
                  {banners.length === 0 ? 'Chưa có banner nào' : 'Không tìm thấy banner phù hợp'}
                </td>
              </tr>
            )}
            {filtered.map((b, i) => (
              <tr key={b.id} className="hover:bg-stone-50/60 transition">
                <td className="px-3.5 py-2 text-stone-400 text-xs">{i + 1}</td>
                <td className="px-3.5 py-2">
                  <OptimizedImage
                    src={resolveMediaUrl(b.imageUrl)}
                    alt={b.title}
                    width={56}
                    height={32}
                    fallbackIcon="megaphone"
                    className="w-full h-full object-cover"
                    wrapperClassName="w-14 h-8 rounded-lg border border-stone-200 overflow-hidden"
                  />
                </td>
                <td className="px-3.5 py-2 font-bold text-stone-900">{b.title}</td>
                <td className="px-3.5 py-2 text-stone-600">{b.displayOrder}</td>
                <td className="px-3.5 py-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                    b.isActive
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-stone-100 text-stone-600 border-stone-200'
                  }`}>
                    {b.isActive ? 'Hiển thị' : 'Ẩn'}
                  </span>
                </td>
                <td className="px-3.5 py-2 text-right">
                  <div className="inline-flex items-center gap-1.5 justify-end">
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer border border-amber-200/60"
                      onClick={() => openEdit(b)}
                    >
                      <Icon name="edit" size={13} /> Sửa
                    </button>
                    <button
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 transition cursor-pointer border border-red-200/60 disabled:opacity-50"
                      onClick={() => setConfirmId(b.id)}
                      disabled={deleting === b.id}
                    >
                      {deleting === b.id ? '...' : <><Icon name="trash" size={13} /> Xóa</>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <BannerModal
          banner={editingBanner}
          onClose={closeModal}
          onSaved={handleSaved}
        />
      )}

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
