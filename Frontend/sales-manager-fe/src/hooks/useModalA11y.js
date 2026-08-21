import { useEffect, useRef } from 'react'

/**
 * Ba thứ tối thiểu mà một hộp thoại phải có, trước đây các modal trong app đều
 * thiếu:
 *
 *  1. Đóng bằng phím Escape — trước chỉ đóng được bằng chuột.
 *  2. Khoá cuộn nền — không thì cuộn chuột trong modal sẽ kéo trang phía sau.
 *  3. Giữ tiêu điểm bên trong (focus trap) và trả tiêu điểm về đúng nút đã mở
 *     modal khi đóng — người dùng bàn phím và trình đọc màn hình cần cái này,
 *     nếu không Tab sẽ chạy ra các nút bị che phía sau.
 *
 * @param {{ onClose: () => void, enabled?: boolean }} options
 * @returns {import('react').RefObject<HTMLElement>} ref gắn vào thẻ hộp thoại
 */
export function useModalA11y({ onClose, enabled = true }) {
  const containerRef = useRef(null)
  // Giữ onClose qua ref để effect không phải chạy lại mỗi lần cha render.
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!enabled) return

    const previouslyFocused = document.activeElement

    // ── Khoá cuộn nền ──
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    // ── Đưa tiêu điểm vào trong modal ──
    const focusablesSelector =
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    const container = containerRef.current
    const first = container?.querySelector(focusablesSelector)
    // autoFocus của React chạy trước effect này nên nếu đã có ô được focus sẵn
    // trong modal thì tôn trọng lựa chọn đó.
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

      // Tab ở phần tử cuối -> vòng về đầu, Shift+Tab ở đầu -> vòng về cuối.
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
