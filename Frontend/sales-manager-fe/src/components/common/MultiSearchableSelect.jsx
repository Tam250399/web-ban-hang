import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/**
 * Component MultiSearchableSelect
 */
function MultiSearchableSelect({
  values = [],
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

  const selectedOptions = options.filter(o => values.includes(String(o.value)))

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

  const toggleValue = (val) => {
    const strVal = String(val)
    if (values.includes(strVal)) {
      onChange(values.filter(v => v !== strVal))
    } else {
      onChange([...values, strVal])
    }
  }

  const removeValue = (val, e) => {
    e.stopPropagation()
    onChange(values.filter(v => v !== String(val)))
  }

  const clearAll = (e) => {
    e.stopPropagation()
    onChange([])
  }

  return (
    <div className={`searchable-select ${open ? 'open' : ''} ${disabled ? 'disabled' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className="searchable-select-trigger multi-trigger"
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        {selectedOptions.length === 0 ? (
          <span className="searchable-select-placeholder">{placeholder}</span>
        ) : (
          <span className="multi-select-tags">
            {selectedOptions.slice(0, 2).map(o => (
              <span key={o.value} className="multi-select-tag">
                {o.label}
                <span className="multi-select-tag-remove" onClick={(e) => removeValue(o.value, e)}>×</span>
              </span>
            ))}
            {selectedOptions.length > 2 && (
              <span className="multi-select-tag more">+{selectedOptions.length - 2}</span>
            )}
          </span>
        )}
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {values.length > 0 && (
            <span className="multi-select-clear" onClick={clearAll}>×</span>
          )}
          <svg className="searchable-select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>

      {open && panelStyle && createPortal(
        <div className="searchable-select-panel" style={panelStyle} ref={panelRef}>
          <input
            ref={searchRef}
            className="searchable-select-search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Escape' && (setOpen(false), setQuery(''))}
            placeholder={searchPlaceholder}
          />
          <div className="searchable-select-options">
            {filtered.length === 0 && (
              <div className="searchable-select-empty">Không tìm thấy kết quả</div>
            )}
            {filtered.map(o => (
              <div
                key={o.value}
                className={`searchable-select-option ${values.includes(String(o.value)) ? 'active' : ''}`}
                onClick={() => toggleValue(o.value)}
              >
                <input
                  type="checkbox"
                  checked={values.includes(String(o.value))}
                  readOnly
                  style={{ marginRight: 8, accentColor: 'var(--primary)', pointerEvents: 'none' }}
                />
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

export default MultiSearchableSelect
