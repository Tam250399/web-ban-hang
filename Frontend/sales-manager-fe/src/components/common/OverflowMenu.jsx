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
    <div className="overflow-menu" ref={rootRef}>
      <button
        type="button"
        className="overflow-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen(o => !o)}
      >
        ⋯
      </button>
      {open && (
        <div className="overflow-menu-panel" role="menu">
          {items.map((item, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              className="overflow-menu-item"
              disabled={item.disabled}
              onClick={() => { setOpen(false); item.onClick() }}
            >
              {item.icon && <span className="overflow-menu-item-icon">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default OverflowMenu
