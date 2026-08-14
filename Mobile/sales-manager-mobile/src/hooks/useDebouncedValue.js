import { useEffect, useState } from 'react'

// Trả về giá trị `value` sau khi ngừng thay đổi trong `delayMs` — dùng cho ô
// tìm kiếm để không lọc/tính toán lại danh sách trên từng phím gõ.
export function useDebouncedValue(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
