import { useEffect, useState } from 'react'

/**
 * Hook trì hoãn cập nhật giá trị sau một khoảng thời gian chờ (debouncing)
 */
export function useDebouncedValue(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
