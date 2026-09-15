import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Component SearchableSelect
 */
function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = '-- Chọn --',
  searchPlaceholder = 'Tìm kiếm...',
  disabled = false,
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [panelStyle, setPanelStyle] = useState(null)
  const wrapRef = useRef(null)
  const panelRef = useRef(null)
  const searchRef = useRef(null)

  const selected = options.find(o => String(o.value) === String(value))

  const updatePosition = () => {
    if (!wrapRef.current) return
    const rect = wrapRef.current.getBoundingClientRect()
    setPanelStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    })
  }

  useEffect(() => {
    const onClickOutside = (e) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        panelRef.current && !panelRef.current.contains(e.target)
      ) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    searchRef.current?.focus()
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open])

  const filtered = options.filter(o =>
    o.label.toLowerCase().includes(query.trim().toLowerCase())
  )

  const handleSelect = (val) => {
    onChange(val)
    setOpen(false)
    setQuery('')
  }

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false)
      setQuery('')
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered.length > 0) handleSelect(filtered[0].value)
    }
  }

  return (
    <div className={`searchable-select ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="searchable-select-trigger"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        <span className={selected ? 'searchable-select-value' : 'searchable-select-placeholder'}>
          {selected ? selected.label : placeholder}
        </span>
        <svg className="searchable-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && panelStyle && createPortal(
        <div className="searchable-select-panel" style={panelStyle} ref={panelRef}>
          <input
            ref={searchRef}
            className="searchable-select-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder={searchPlaceholder}
          />
          <div className="searchable-select-options">
            <div
              className={`searchable-select-option ${!value ? 'active' : ''}`}
              onClick={() => handleSelect('')}
            >
              {placeholder}
            </div>
            {filtered.length === 0 && (
              <div className="searchable-select-empty">Không tìm thấy kết quả</div>
            )}
            {filtered.map(o => (
              <div
                key={o.value}
                className={`searchable-select-option ${String(o.value) === String(value) ? 'active' : ''}`}
                onClick={() => handleSelect(o.value)}
              >
                {o.label}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default SearchableSelect
