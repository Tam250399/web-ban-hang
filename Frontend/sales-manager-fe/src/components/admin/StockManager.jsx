import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { stockService } from '../../services/stockService'
import Pagination from '../common/Pagination'

const EMPTY_FORM = { productId: '', type: 'Import', quantity: '', unitPrice: '', note: '' }
const PAGE_SIZE  = 10

function StockManager({ products }) {
  const [form, setForm]               = useState(EMPTY_FORM)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading]         = useState(false)
  const [page, setPage]               = useState(1)

  const loadTransactions = () =>
    stockService.getAll().then(setTransactions).catch(() => {})

  useEffect(() => { loadTransactions() }, [])

  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await stockService.create({
        ...form,
        productId: +form.productId,
        quantity:  +form.quantity,
        unitPrice: +form.unitPrice,
      })
      toast.success(`${form.type === 'Import' ? 'Nhập kho' : 'Xuất kho'} thành công!`)
      setForm(EMPTY_FORM)
      setPage(1)
      loadTransactions()
    } catch (err) {
      toast.error(err.message || 'Có lỗi xảy ra.')
    }
    setLoading(false)
  }

  const totalPages = Math.ceil(transactions.length / PAGE_SIZE)
  const paginated  = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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

            <div className="row">
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

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Đang xử lý...' : 'Xác nhận giao dịch'}
            </button>
          </form>
        </div>

        {/* Lịch sử giao dịch */}
        <div>
          <h4 style={{ marginBottom: 12 }}>
            Lịch sử giao dịch
            <span className="count-badge" style={{ marginLeft: 8 }}>{transactions.length}</span>
          </h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>#</th>
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
                {paginated.map((t, i) => (
                  <tr key={t.id}>
                    <td style={{ color: 'var(--text)', fontSize: '0.8rem' }}>{(page - 1) * PAGE_SIZE + i + 1}</td>
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
                    <td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                      Chưa có giao dịch nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={totalPages}
            total={transactions.length}
            label="giao dịch"
            onPage={setPage}
          />
        </div>

      </div>
    </div>
  )
}

export default StockManager
