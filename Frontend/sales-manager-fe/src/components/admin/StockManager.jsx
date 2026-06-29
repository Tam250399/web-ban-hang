import { useEffect, useState } from 'react'
import { API } from './api'

const EMPTY_FORM = { productId: '', type: 'Import', quantity: '', unitPrice: '', note: '' }

function StockManager({ products }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [transactions, setTransactions] = useState([])
  const [msg, setMsg] = useState(null)
  const [loading, setLoading] = useState(false)

  const loadTransactions = () =>
    fetch(`${API}/stock`).then(r => r.json()).then(setTransactions).catch(() => {})

  useEffect(() => { loadTransactions() }, [])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMsg(null)
    try {
      const res = await fetch(`${API}/stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          productId: +form.productId,
          quantity: +form.quantity,
          unitPrice: +form.unitPrice
        })
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: 'success', text: `${form.type === 'Import' ? 'Nhập kho' : 'Xuất kho'} thành công!` })
        setForm(EMPTY_FORM)
        loadTransactions()
      } else {
        setMsg({ type: 'error', text: data.message || 'Có lỗi xảy ra.' })
      }
    } catch {
      setMsg({ type: 'error', text: 'Không thể kết nối máy chủ.' })
    }
    setLoading(false)
  }

  return (
    <div>
      <h3 className="tab-title">Quản lý nhập / xuất kho</h3>
      <div className="stock-layout">

        {/* Form tạo phiếu */}
        <div className="form-card">
          <h4>Tạo phiếu giao dịch</h4>
          <form onSubmit={handleSubmit} className="stock-form">
            <label className="form-field">
              <span>Sản phẩm <span className="required">*</span></span>
              <select value={form.productId} onChange={set('productId')} required>
                <option value="">-- Chọn sản phẩm --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.productCode} - {p.productName}</option>
                ))}
              </select>
            </label>

            <label className="form-field">
              <span>Loại giao dịch <span className="required">*</span></span>
              <select value={form.type} onChange={set('type')}>
                <option value="Import">📥 Nhập kho</option>
                <option value="Export">📤 Xuất kho (bán ra)</option>
              </select>
            </label>

            <div className="form-row">
              <label className="form-field">
                <span>Số lượng <span className="required">*</span></span>
                <input type="number" value={form.quantity} onChange={set('quantity')} required min="1" />
              </label>
              <label className="form-field">
                <span>Đơn giá (VNĐ) <span className="required">*</span></span>
                <input type="number" value={form.unitPrice} onChange={set('unitPrice')} required min="0" />
              </label>
            </div>

            <label className="form-field">
              <span>Ghi chú</span>
              <input type="text" value={form.note} onChange={set('note')} placeholder="Nhà cung cấp, khách hàng..." />
            </label>

            {msg && <p className={`message ${msg.type}`}>{msg.text}</p>}
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận giao dịch'}
            </button>
          </form>
        </div>

        {/* Lịch sử giao dịch */}
        <div>
          <h4 style={{ marginBottom: 12 }}>Lịch sử giao dịch gần nhất</h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Ngày</th>
                  <th>Sản phẩm</th>
                  <th>Loại</th>
                  <th>SL</th>
                  <th>Đơn giá</th>
                  <th>Thành tiền</th>
                  <th>Ghi chú</th>
                </tr>
              </thead>
              <tbody>
                {transactions.slice(0, 15).map(t => (
                  <tr key={t.id}>
                    <td>{new Date(t.transactionDate).toLocaleDateString('vi-VN')}</td>
                    <td>{t.productName}</td>
                    <td>
                      <span className={t.type === 'Import' ? 'badge-import' : 'badge-export'}>
                        {t.type === 'Import' ? '📥 Nhập' : '📤 Xuất'}
                      </span>
                    </td>
                    <td>{t.quantity}</td>
                    <td>{t.unitPrice?.toLocaleString('vi-VN')}đ</td>
                    <td><strong>{(t.quantity * t.unitPrice)?.toLocaleString('vi-VN')}đ</strong></td>
                    <td>{t.note || '-'}</td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default StockManager
