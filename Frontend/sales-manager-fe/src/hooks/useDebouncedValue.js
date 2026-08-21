import { useEffect, useState } from 'react'

// Hoãn cập nhật giá trị cho tới khi người dùng ngừng gõ `delayMs` mili giây.
// Dùng cho ô tìm kiếm: trước đây mỗi ký tự đều lọc lại toàn bộ mảng sản phẩm
// rồi render lại mọi thẻ, gõ nhanh là thấy giật rõ.
export function useDebouncedValue(value, delayMs = 250) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
