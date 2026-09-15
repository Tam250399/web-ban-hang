import { useEffect, useRef } from 'react'

export function useModalA11y({ onClose, enabled = true }) {
  const containerRef = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!enabled) return

    const previouslyFocused = document.activeElement

    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const focusablesSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    const container = containerRef.current
    const first = container?.querySelector(focusablesSelector)
    if (container && !container.contains(document.activeElement)) {
      first?.focus?.()
    }

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (e.key !== 'Tab' || !containerRef.current) return

      const focusables = Array.from(
        containerRef.current.querySelectorAll(focusablesSelector)
      ).filter((el) => el.offsetParent !== null)
      if (focusables.length === 0) return

      const firstEl = focusables[0]
      const lastEl = focusables[focusables.length - 1]

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault()
        lastEl.focus()
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault()
        firstEl.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = originalOverflow
      previouslyFocused?.focus?.()
    }
  }, [enabled])

  return containerRef
}
