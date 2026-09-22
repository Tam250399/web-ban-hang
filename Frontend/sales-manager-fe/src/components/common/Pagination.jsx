const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 py-2.5 px-3 text-xs text-brand-text border-t border-brand-divider/40">
      <div>
        Hiển thị <strong className="text-ink font-bold">{start}-{end}</strong> / <strong className="text-ink font-bold">{total}</strong> {label}
      </div>

      {onPageSizeChange && (
        <label className="flex items-center gap-2 text-xs">
          <span>Số dòng/trang</span>
          <select
            value={pageSize}
            onChange={e => onPageSizeChange(+e.target.value)}
            className="px-2 py-0.5 rounded-lg border border-brand-divider bg-white text-ink text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
          >
            {pageSizeOptions.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}

      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            className="min-w-8 h-8 px-2 flex items-center justify-center rounded-lg border border-brand-divider text-xs font-semibold text-ink bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            onClick={() => onPage(1)}
            disabled={page === 1}
            title="Trang đầu"
          >
            «
          </button>
          <button
            className="min-w-8 h-8 px-2 flex items-center justify-center rounded-lg border border-brand-divider text-xs font-semibold text-ink bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            onClick={() => onPage(page - 1)}
            disabled={page === 1}
            title="Trang trước"
          >
            ‹
          </button>
          {pages.map((p, i) =>
            p === '...' ? (
              <span key={`el${i}`} className="px-1 text-neutral-400 text-xs">
                …
              </span>
            ) : (
              <button
                key={p}
                className={`min-w-8 h-8 px-2.5 flex items-center justify-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                  page === p
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'border-brand-divider text-ink bg-white hover:bg-neutral-50'
                }`}
                onClick={() => onPage(p)}
              >
                {p}
              </button>
            )
          )}
          <button
            className="min-w-8 h-8 px-2 flex items-center justify-center rounded-lg border border-brand-divider text-xs font-semibold text-ink bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            onClick={() => onPage(page + 1)}
            disabled={page === totalPages}
            title="Trang sau"
          >
            ›
          </button>
          <button
            className="min-w-8 h-8 px-2 flex items-center justify-center rounded-lg border border-brand-divider text-xs font-semibold text-ink bg-white hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
            onClick={() => onPage(totalPages)}
            disabled={page === totalPages}
            title="Trang cuối"
          >
            »
          </button>
        </div>
      )}
    </div>
  )
}

export default Pagination
