import { useState, useEffect } from 'react'
import { API } from './api'

const EMPTY_FORM = {
  productCode: '', productName: '', categoryId: '', unitTypeId: '',
  price: '', stockQuantity: '', description: '', imageUrl: ''
}

function AddProduct({ onRefresh }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [categories, setCategories] = useState([])
  const [unitTypes, setUnitTypes] = useState([])
  const [productNames, setProductNames] = useState([])
  const [filteredNames, setFilteredNames] = useState([])
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch(`${API}/category/product-categories`).then(r => r.json()).then(setCategories).catch(() => {})
    fetch(`${API}/category/unit-types`).then(r => r.json()).then(setUnitTypes).catch(() => {})
    fetch(`${API}/category/product-names`).then(r => r.json()).then(setProductNames).catch(() => {})
  }, [])

  // Khi chọn danh mục → lọc tên sản phẩm theo danh mục đó
  useEffect(() => {
    if (form.categoryId) {
      setFilteredNames(productNames.filter(n => n.categoryId === +form.categoryId))
    } else {
      setFilteredNames(productNames)
    }
  }, [form.categoryId, productNames])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`${API}/product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price: +form.price,
          stockQuantity: +form.stockQuantity,
          categoryId: form.categoryId ? +form.categoryId : null,
          unitTypeId: form.unitTypeId ? +form.unitTypeId : null,
        })
      })
      if (res.ok) {
        setMsg({ type: 'success', text: 'Thêm sản phẩm thành công!' })
        setForm(EMPTY_FORM)
        onRefresh()
      } else {
        const data = await res.json()
        setMsg({ type: 'error', text: data.message || 'Có lỗi xảy ra.' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Không thể kết nối máy chủ.' })
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

          <label className="form-field">
            <span>URL hình ảnh</span>
            <input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://..." />
          </label>

          {msg && <p className={`message ${msg.type}`}>{msg.text}</p>}

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Đang lưu...' : '+ Thêm sản phẩm'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default AddProduct
