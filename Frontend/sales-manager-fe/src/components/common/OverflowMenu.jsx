import { useEffect, useRef, useState } from 'react'

/**
 * Menu tùy chọn ba chấm thu gọn
 */
function OverflowMenu({ items, label = 'Thêm thao tác' }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        type="button"
        className={`w-8 h-8 rounded-lg border bg-white flex items-center justify-center font-bold text-sm transition shadow-2xs cursor-pointer ${
          open
            ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20'
            : 'border-stone-200 text-stone-600 hover:border-primary hover:text-stone-900 hover:bg-stone-50'
        }`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(o => !o)}
      >
        ⋯
      </button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1.5 z-40 min-w-[160px] bg-white border border-stone-200 rounded-xl shadow-lg p-1 animate-in fade-in zoom-in-95 duration-100 flex flex-col space-y-0.5"
          role="menu"
        >
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              className="w-full px-3 py-1.5 rounded-lg text-left text-xs font-medium flex items-center gap-2 transition cursor-pointer text-stone-700 hover:bg-stone-100 hover:text-stone-900 disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={item.disabled}
              onClick={() => { setOpen(false); item.onClick() }}
            >
              {item.icon && <span className="text-sm shrink-0">{item.icon}</span>}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default OverflowMenu
