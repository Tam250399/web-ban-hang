import { useEffect, useMemo, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { uploadImage } from '../../services/uploadService'
import SearchableSelect from '../common/SearchableSelect'
import MoneyInput from '../common/MoneyInput'
import { Icon } from '../common/Icon'

const EMPTY_FORM = {
  productCode: '', productName: '', categoryId: '', unitTypeId: '',
  price: '', stockQuantity: '', description: '', imageUrl: ''
}

/**
 * Component form thêm mới hoặc chỉnh sửa thông tin sản phẩm
 */
function AddProduct({ onRefresh, onSuccess, onClose }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [categories, setCategories] = useState([])
  const [unitTypes, setUnitTypes] = useState([])
  const [productNames, setProductNames] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {})
    categoryService.getUnitTypes().then(setUnitTypes).catch(() => {})
    categoryService.getProductNames().then(setProductNames).catch(() => {})
  }, [])

  const filteredNames = useMemo(() => {
    if (!form.categoryId) return productNames
    return productNames.filter(n => n.categoryId === +form.categoryId)
  }, [form.categoryId, productNames])

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
    if (!form.unitTypeId) {
      toast.error('Vui lòng chọn đơn vị tính.')
      return
    }
    setLoading(true)
    try {
      await productService.create({
        ...form,
        price: +form.price,
        stockQuantity: +form.stockQuantity,
        categoryId: form.categoryId ? +form.categoryId : null,
        unitTypeId: form.unitTypeId ? +form.unitTypeId : null,
      })
      toast.success('Thêm sản phẩm thành công!')
      setForm(EMPTY_FORM)
      setImagePreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onSuccess ? onSuccess() : onRefresh()
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden my-8" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
          <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
            <Icon name="package" size={20} className="text-primary" />
            Thêm sản phẩm mới
          </h3>
          <button className="w-8 h-8 rounded-full flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer text-sm font-bold" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">

            <div className="md:col-span-1 space-y-2">
              <p className="text-xs sm:text-sm font-bold text-stone-700">Hình ảnh sản phẩm</p>
              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-stone-200 aspect-square max-h-[240px] bg-stone-50 flex items-center justify-center group">
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
                <label className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition min-h-[200px] ${
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
                  <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-stone-200/60 flex items-center justify-center text-stone-400 mb-2">
                    <Icon name="image" size={24} />
                  </div>
                  <span className="text-xs font-bold text-stone-800">{uploading ? 'Đang tải lên...' : 'Nhấn để chọn ảnh'}</span>
                  <span className="text-[11px] text-stone-400 mt-1">JPG, PNG, WEBP, GIF · Tối đa 5MB</span>
                </label>
              )}
            </div>

            <div className="md:col-span-2 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                  <span>Mã sản phẩm <span className="text-red-500">*</span></span>
                  <input
                    className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                    value={form.productCode}
                    onChange={set('productCode')}
                    required
                    placeholder="VD: XM001"
                  />
                </label>

                <div className="block text-xs sm:text-sm font-semibold text-stone-700">
                  <span>Danh mục sản phẩm</span>
                  <div className="mt-1.5">
                    <SearchableSelect
                      value={form.categoryId}
                      onChange={(val) => setForm(f => ({ ...f, categoryId: val }))}
                      options={categories.map(c => ({ value: c.id, label: c.name }))}
                      placeholder="-- Chọn danh mục --"
                      searchPlaceholder="Tìm danh mục..."
                    />
                  </div>
                </div>
              </div>

              <div className="block text-xs sm:text-sm font-semibold text-stone-700">
                <span>Tên sản phẩm <span className="text-red-500">*</span></span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                  <SearchableSelect
                    value={filteredNames.find(n => n.name === form.productName) ? form.productName : ''}
                    onChange={(val) => setForm(f => ({ ...f, productName: val }))}
                    options={filteredNames.map(n => ({ value: n.name, label: n.name }))}
                    placeholder="-- Chọn tên từ danh mục --"
                    searchPlaceholder="Tìm tên sản phẩm..."
                  />
                  <input
                    className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                    value={form.productName}
                    onChange={set('productName')}
                    required
                    placeholder="Hoặc nhập tên mới..."
                  />
                </div>
                <span className="text-[11px] text-stone-400 mt-1 block">
                  Chọn từ danh sách hoặc nhập tên tùy chỉnh
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="block text-xs sm:text-sm font-semibold text-stone-700">
                  <span>Đơn vị tính <span className="text-red-500">*</span></span>
                  <div className="mt-1.5">
                    <SearchableSelect
                      value={form.unitTypeId}
                      onChange={(val) => setForm(f => ({ ...f, unitTypeId: val }))}
                      options={unitTypes.map(u => ({ value: u.id, label: u.name }))}
                      placeholder="-- Chọn đơn vị --"
                      searchPlaceholder="Tìm đơn vị..."
                    />
                  </div>
                </div>

                <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                  <span>Giá bán (VNĐ) <span className="text-red-500">*</span></span>
                  <div className="mt-1.5">
                    <MoneyInput value={form.price} onChange={set('price')} required min="0" placeholder="0" />
                  </div>
                </label>
              </div>

              <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                <span>Số lượng ban đầu <span className="text-red-500">*</span></span>
                <input
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  type="number"
                  value={form.stockQuantity}
                  onChange={set('stockQuantity')}
                  required
                  min="0"
                  placeholder="0"
                />
              </label>

              <label className="block text-xs sm:text-sm font-semibold text-stone-700">
                <span>Mô tả sản phẩm</span>
                <input
                  className="w-full mt-1.5 px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50/50 text-stone-900 text-xs sm:text-sm focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Mô tả ngắn về sản phẩm..."
                />
              </label>
            </div>

          </div>

          <div className="px-6 py-4 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-3">
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
              {loading ? 'Đang lưu...' : '+ Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProduct
