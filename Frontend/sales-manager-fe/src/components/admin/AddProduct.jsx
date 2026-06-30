import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { productService } from '../../services/productService'
import { categoryService } from '../../services/categoryService'
import { uploadImage } from '../../services/uploadService'

const EMPTY_FORM = {
  productCode: '', productName: '', categoryId: '', unitTypeId: '',
  price: '', stockQuantity: '', description: '', imageUrl: ''
}

function AddProduct({ onRefresh, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [categories, setCategories] = useState([])
  const [unitTypes, setUnitTypes] = useState([])
  const [productNames, setProductNames] = useState([])
  const [filteredNames, setFilteredNames] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    categoryService.getCategories().then(setCategories).catch(() => {})
    categoryService.getUnitTypes().then(setUnitTypes).catch(() => {})
    categoryService.getProductNames().then(setProductNames).catch(() => {})
  }, [])

  useEffect(() => {
    if (form.categoryId) {
      setFilteredNames(productNames.filter(n => n.categoryId === +form.categoryId))
    } else {
      setFilteredNames(productNames)
    }
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
    <div>
      <h3 className="tab-title">Thêm sản phẩm mới</h3>
      <div className="form-card">
        <form onSubmit={handleSubmit} className="add-product-form">

          <div className="form-row">
            <label className="form-field">
              <span>Mã sản phẩm <span className="required">*</span></span>
              <input value={form.productCode} onChange={set('productCode')} required placeholder="VD: XM001" />
            </label>

            <label className="form-field">
              <span>Danh mục sản phẩm</span>
              <select value={form.categoryId} onChange={set('categoryId')}>
                <option value="">-- Chọn danh mục --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
          </div>

          <label className="form-field">
            <span>Tên sản phẩm <span className="required">*</span></span>
            <div style={{ display: 'flex', gap: 8 }}>
              <select
                style={{ flex: 1 }}
                value={filteredNames.find(n => n.name === form.productName) ? form.productName : ''}
                onChange={e => setForm(f => ({ ...f, productName: e.target.value }))}
              >
                <option value="">-- Chọn tên từ danh mục --</option>
                {filteredNames.map(n => <option key={n.id} value={n.name}>{n.name}</option>)}
              </select>
              <input
                style={{ flex: 1 }}
                value={form.productName}
                onChange={set('productName')}
                required
                placeholder="Hoặc nhập tên mới..."
              />
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text)' }}>
              Chọn từ danh sách hoặc nhập tên tùy chỉnh
            </span>
          </label>

          <div className="form-row">
            <label className="form-field">
              <span>Đơn vị tính <span className="required">*</span></span>
              <select value={form.unitTypeId} onChange={set('unitTypeId')} required>
                <option value="">-- Chọn đơn vị --</option>
                {unitTypes.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </select>
            </label>

            <label className="form-field">
              <span>Giá bán (VNĐ) <span className="required">*</span></span>
              <input type="number" value={form.price} onChange={set('price')} required min="0" placeholder="0" />
            </label>
          </div>

          <label className="form-field">
            <span>Số lượng ban đầu <span className="required">*</span></span>
            <input type="number" value={form.stockQuantity} onChange={set('stockQuantity')} required min="0" placeholder="0" />
          </label>

          <label className="form-field">
            <span>Mô tả sản phẩm</span>
            <input value={form.description} onChange={set('description')} placeholder="Mô tả ngắn về sản phẩm..." />
          </label>

          <div className="form-field">
            <span>Hình ảnh sản phẩm</span>
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

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : '+ Thêm sản phẩm'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddProduct
