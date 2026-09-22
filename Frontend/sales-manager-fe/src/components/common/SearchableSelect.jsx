import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

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
    <div className={`relative w-full ${disabled ? 'opacity-60 pointer-events-none' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className={`w-full min-h-[38px] px-3 py-1.5 bg-white border rounded-lg text-xs sm:text-sm text-left flex items-center justify-between gap-2 shadow-2xs transition cursor-pointer disabled:cursor-not-allowed ${
          open ? 'border-primary ring-2 ring-primary/20' : 'border-stone-300 hover:border-primary'
        }`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        <span className={`truncate ${selected ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>
          {selected ? selected.label : placeholder}
        </span>
        <Icon
          name="chevronDown"
          size={14}
          className={`shrink-0 text-stone-400 transition-transform duration-150 ${open ? 'rotate-180 text-primary' : ''}`}
        />
      </button>

      {open && panelStyle && createPortal(
        <div
          ref={panelRef}
          style={panelStyle}
          className="z-50 bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="p-1.5 border-b border-stone-100 bg-stone-50/50">
            <input
              ref={searchRef}
              className="w-full px-2.5 py-1.5 text-xs sm:text-sm bg-white border border-stone-200 rounded-md outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={searchPlaceholder}
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1 text-xs sm:text-sm space-y-0.5">
            <div
              className={`px-3 py-1.5 rounded-lg cursor-pointer transition select-none ${
                !value ? 'bg-primary/10 text-primary font-semibold' : 'text-stone-700 hover:bg-stone-100'
              }`}
              onClick={() => handleSelect('')}
            >
              {placeholder}
            </div>
            {filtered.length === 0 && (
              <div className="py-4 text-center text-xs text-stone-400">Không tìm thấy kết quả</div>
            )}
            {filtered.map(o => (
              <div
                key={o.value}
                className={`px-3 py-1.5 rounded-lg cursor-pointer flex items-center transition select-none ${
                  String(o.value) === String(value)
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-stone-700 hover:bg-stone-100'
                }`}
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
