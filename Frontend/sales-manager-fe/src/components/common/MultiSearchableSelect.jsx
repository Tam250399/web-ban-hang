import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Icon } from './Icon'

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
    <div className={`relative w-full ${disabled ? 'opacity-60 pointer-events-none' : ''}`} ref={wrapRef}>
      <button
        type="button"
        className={`w-full min-h-[38px] px-2.5 py-1.5 bg-white border rounded-lg text-xs sm:text-sm text-left flex items-center justify-between gap-1.5 shadow-2xs transition cursor-pointer disabled:cursor-not-allowed ${
          open ? 'border-primary ring-2 ring-primary/20' : 'border-stone-300 hover:border-primary'
        }`}
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
      >
        {selectedOptions.length === 0 ? (
          <span className="text-stone-400 truncate">{placeholder}</span>
        ) : (
          <span className="flex flex-wrap items-center gap-1 min-w-0">
            {selectedOptions.slice(0, 2).map(o => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 bg-stone-100 text-stone-800 text-[11px] font-medium px-2 py-0.5 rounded-md border border-stone-200 max-w-[120px] truncate"
              >
                <span className="truncate">{o.label}</span>
                <span
                  className="text-stone-400 hover:text-red-500 font-bold ml-0.5 cursor-pointer leading-none"
                  onClick={(e) => removeValue(o.value, e)}
                >
                  ×
                </span>
              </span>
            ))}
            {selectedOptions.length > 2 && (
              <span className="inline-flex items-center text-[11px] font-semibold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-md">
                +{selectedOptions.length - 2}
              </span>
            )}
          </span>
        )}
        <span className="flex items-center gap-1 shrink-0">
          {values.length > 0 && (
            <span
              className="text-stone-400 hover:text-stone-700 px-1 text-sm font-bold cursor-pointer leading-none"
              onClick={clearAll}
            >
              ×
            </span>
          )}
          <Icon
            name="chevronDown"
            size={14}
            className={`shrink-0 text-stone-400 transition-transform duration-150 ${open ? 'rotate-180 text-primary' : ''}`}
          />
        </span>
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
              onKeyDown={e => e.key === 'Escape' && (setOpen(false), setQuery(''))}
              placeholder={searchPlaceholder}
            />
          </div>
          <div className="max-h-56 overflow-y-auto p-1 text-xs sm:text-sm space-y-0.5">
            {filtered.length === 0 && (
              <div className="py-4 text-center text-xs text-stone-400">Không tìm thấy kết quả</div>
            )}
            {filtered.map(o => {
              const active = values.includes(String(o.value))
              return (
                <div
                  key={o.value}
                  className={`px-3 py-1.5 rounded-lg cursor-pointer flex items-center gap-2 transition select-none ${
                    active ? 'bg-primary/10 text-primary font-semibold' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                  onClick={() => toggleValue(o.value)}
                >
                  <input
                    type="checkbox"
                    checked={active}
                    readOnly
                    className="accent-primary rounded pointer-events-none"
                  />
                  <span>{o.label}</span>
                </div>
              )
            })}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default MultiSearchableSelect
