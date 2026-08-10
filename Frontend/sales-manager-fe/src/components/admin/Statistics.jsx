function StatCard({ icon, label, value, color }) {
  return (
    <div className="stat-box" style={{ borderTop: `4px solid ${color}` }}>
      <span className="stat-box-icon">{icon}</span>
      <div>
        <p className="stat-box-label">{label}</p>
        <p className="stat-box-value">{value}</p>
      </div>
    </div>
  )
}

function Statistics({ stats }) {
  if (!stats) {
    return (
      <div className="loading-state">
        <div className="spinner" />
        <p>Đang tải thống kê...</p>
      </div>
    )
  }

  return (
    <div>
      <h3 className="tab-title">Thống kê tổng quan</h3>

      <div className="stats-grid">
        <StatCard icon="📦" label="Tổng sản phẩm"        value={stats.totalProducts}                                      color="#C1440E" />
        <StatCard icon="💰" label="Giá trị tồn kho"       value={`${stats.totalStockValue?.toLocaleString('vi-VN')}đ`}    color="#4A5560" />
        <StatCard icon="📥" label="Tổng nhập kho"         value={`${stats.totalImported?.toLocaleString('vi-VN')}đ`}      color="#22c55e" />
        <StatCard icon="📤" label="Tổng bán ra"           value={`${stats.totalExported?.toLocaleString('vi-VN')}đ`}      color="#F2B705" />
        <StatCard icon="⚠️" label="Sản phẩm sắp hết"     value={stats.lowStockCount}                                     color="#C1440E" />
      </div>

      <div className="stats-detail-grid">

        {/* Thống kê theo danh mục */}
        <div className="form-card">
          <h4>Thống kê theo danh mục</h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Danh mục</th><th>Số SP</th><th>Giá trị tồn</th></tr>
              </thead>
              <tbody>
                {stats.categoryStats?.map(c => (
                  <tr key={c.category}>
                    <td>{c.category}</td>
                    <td>{c.count}</td>
                    <td>{c.totalValue?.toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
                {!stats.categoryStats?.length && (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>Chưa có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Giao dịch gần nhất */}
        <div className="form-card">
          <h4>Giao dịch gần nhất</h4>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Sản phẩm</th><th>Loại</th><th>SL</th><th>Thành tiền</th></tr>
              </thead>
              <tbody>
                {stats.recentTransactions?.map(t => (
                  <tr key={t.id}>
                    <td>{t.productName}</td>
                    <td>
                      <span className={t.type === 'Import' ? 'badge-import' : 'badge-export'}>
                        {t.type === 'Import' ? '📥 Nhập' : '📤 Xuất'}
                      </span>
                    </td>
                    <td>{t.quantity}</td>
                    <td>{(t.quantity * t.unitPrice)?.toLocaleString('vi-VN')}đ</td>
                  </tr>
                ))}
                {!stats.recentTransactions?.length && (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888' }}>Chưa có dữ liệu</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Statistics
