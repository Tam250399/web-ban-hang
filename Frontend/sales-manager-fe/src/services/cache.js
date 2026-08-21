// Bộ nhớ đệm cho dữ liệu đọc từ API, lưu trên localStorage.
// Mục đích chính không phải tiết kiệm request mà là để web còn dùng được khi
// mất mạng: mở lên vẫn thấy danh sách của lần trước thay vì trang trắng.

const PREFIX = 'salesManagerCache:'

export const CACHE_KEYS = {
  products: 'products',
  myOrders: 'myOrders',
}

/** @returns {{ data: any, cachedAt: number } | null} */
export function readCache(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.cachedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export function writeCache(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, cachedAt: Date.now() }))
  } catch {
    // Hết quota hoặc chế độ riêng tư chặn ghi — cache chỉ là tối ưu, không được
    // làm hỏng luồng chính.
  }
}

/** Xoá toàn bộ cache — dùng khi đăng xuất để không lộ dữ liệu cho tài khoản khác. */
export function clearAllCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
    // như trên
  }
}

/** "5 phút trước", "2 giờ trước"... để báo cho người dùng dữ liệu cũ cỡ nào. */
export function formatCacheAge(cachedAt) {
  if (!cachedAt) return ''
  const minutes = Math.floor((Date.now() - cachedAt) / 60000)
  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}
