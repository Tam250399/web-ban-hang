const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50]

/**
 * Component Pagination
 */
function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageSizeChange,
  label = 'mục',
  onPage,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
}) {
  if (!total) return null

  const start = (page - 1) * pageSize + 1
  const end = Math.min(page * pageSize, total)

  const pages = totalPages > 1
    ? Array.from({ length: totalPages }, (_, i) => i + 1)
        .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
        .reduce((acc, p, idx, arr) => {
          if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('...')
          acc.push(p)
          return acc
        }, [])
    : []

  return (
    <div className="table-footer">
      <div className="table-footer-info">
        Hiển thị <strong>{start}-{end}</strong> / <strong>{total}</strong> {label}
      </div>

      {onPageSizeChange && (
        <label className="table-footer-size">
          Số dòng/trang
          <select value={pageSize} onChange={e => onPageSizeChange(+e.target.value)}>
            {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button className="page-btn" onClick={() => onPage(1)} disabled={page === 1}>«</button>
          <button className="page-btn" onClick={() => onPage(page - 1)} disabled={page === 1}>‹</button>
          {pages.map((p, i) =>
            p === '...'
              ? <span key={`el${i}`} className="page-ellipsis">…</span>
              : <button
                  key={p}
                  className={`page-btn ${page === p ? 'active' : ''}`}
                  onClick={() => onPage(p)}
                >{p}</button>
          )}
          <button className="page-btn" onClick={() => onPage(page + 1)} disabled={page === totalPages}>›</button>
          <button className="page-btn" onClick={() => onPage(totalPages)} disabled={page === totalPages}>»</button>
        </div>
      )}
    </div>
  )
}

export default Pagination
