function Pagination({ page, totalPages, total, label = 'mục', onPage }) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
    .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
    .reduce((acc, p, idx, arr) => {
      if (idx > 0 && arr[idx - 1] !== p - 1) acc.push('...')
      acc.push(p)
      return acc
    }, [])

  return (
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
      {total != null && <span className="page-info">{total} {label}</span>}
    </div>
  )
}

export default Pagination
