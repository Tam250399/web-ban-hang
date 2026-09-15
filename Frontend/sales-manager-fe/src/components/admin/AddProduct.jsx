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
    <div className="modal-overlay">
      <div className="modal-box edit-product-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Thêm sản phẩm mới</h3>
          <button className="modal-close" onClick={onClose} aria-label="Đóng">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="edit-modal-body">

            <div className="edit-modal-image">
              <p className="form-field-label">Hình ảnh sản phẩm</p>
              {imagePreview ? (
                <div className="image-upload-preview" style={{ maxHeight: 220 }}>
                  <img src={imagePreview} alt="preview" />
                  {uploading && <div className="image-upload-overlay">Đang tải...</div>}
                  {!uploading && (
                    <button type="button" className="image-remove-btn" onClick={removeImage} aria-label="Xoá ảnh">✕</button>
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
                  <span className="image-upload-icon"><Icon name="image" size={30} /></span>
                  <span>{uploading ? 'Đang tải lên...' : 'Nhấn để chọn ảnh'}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text)' }}>JPG, PNG, WEBP, GIF · Tối đa 5MB</span>
                </label>
              )}
            </div>

            <div className="edit-modal-fields">
              <div className="form-row">
                <label className="form-field">
                  <span>Mã sản phẩm <span className="required">*</span></span>
                  <input value={form.productCode} onChange={set('productCode')} required placeholder="VD: XM001" />
                </label>

                <div className="form-field">
                  <span>Danh mục sản phẩm</span>
                  <SearchableSelect
                    value={form.categoryId}
                    onChange={(val) => setForm(f => ({ ...f, categoryId: val }))}
                    options={categories.map(c => ({ value: c.id, label: c.name }))}
                    placeholder="-- Chọn danh mục --"
                    searchPlaceholder="Tìm danh mục..."
                  />
                </div>
              </div>

              <div className="form-field">
                <span>Tên sản phẩm <span className="required">*</span></span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <SearchableSelect
                      value={filteredNames.find(n => n.name === form.productName) ? form.productName : ''}
                      onChange={(val) => setForm(f => ({ ...f, productName: val }))}
                      options={filteredNames.map(n => ({ value: n.name, label: n.name }))}
                      placeholder="-- Chọn tên từ danh mục --"
                      searchPlaceholder="Tìm tên sản phẩm..."
                    />
                  </div>
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
              </div>

              <div className="form-row">
                <div className="form-field">
                  <span>Đơn vị tính <span className="required">*</span></span>
                  <SearchableSelect
                    value={form.unitTypeId}
                    onChange={(val) => setForm(f => ({ ...f, unitTypeId: val }))}
                    options={unitTypes.map(u => ({ value: u.id, label: u.name }))}
                    placeholder="-- Chọn đơn vị --"
                    searchPlaceholder="Tìm đơn vị..."
                  />
                </div>

                <label className="form-field">
                  <span>Giá bán (VNĐ) <span className="required">*</span></span>
                  <MoneyInput value={form.price} onChange={set('price')} required min="0" placeholder="0" />
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
            </div>

          </div>

          <div className="modal-footer">
            <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
            <button className="btn-primary" type="submit" disabled={loading || uploading}>
              {loading ? 'Đang lưu...' : '+ Thêm sản phẩm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddProduct
