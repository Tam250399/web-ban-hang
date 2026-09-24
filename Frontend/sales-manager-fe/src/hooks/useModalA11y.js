import { useEffect, useLayoutEffect, useRef } from 'react'

/**
 * Hook quản lý phím tắt, khóa cuộn trang (không giật layout) và khả năng truy cập a11y cho hộp thoại Modal
 */
export function useModalA11y({ onClose, enabled = true }) {
  const containerRef = useRef(null)
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useLayoutEffect(() => {
    if (!enabled) return

    const previouslyFocused = document.activeElement

    const originalOverflow = document.body.style.overflow
    const originalPaddingRight = document.body.style.paddingRight

    // Tính độ rộng thanh cuộn scrollbar của hệ điều hành/trình duyệt để bù trừ paddingRight,
    // loại bỏ hoàn toàn hiện tượng giật trang (layout shift 15-17px) khi mở/đóng modal trên Windows
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
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
      document.body.style.paddingRight = originalPaddingRight
      previouslyFocused?.focus?.()
    }
  }, [enabled])

  return containerRef
}
