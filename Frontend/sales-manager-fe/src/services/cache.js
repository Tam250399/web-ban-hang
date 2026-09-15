
const PREFIX = 'salesManagerCache:'

export const CACHE_KEYS = {
  products: 'products',
  myOrders: 'myOrders',
}

/**
 * Đọc dữ liệu đã lưu trong localStorage theo khóa
 */
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

/**
 * Lưu dữ liệu mới vào localStorage kèm mốc thời gian ghi nhận
 */
export function writeCache(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ data, cachedAt: Date.now() }))
  } catch {
  }
}

/**
 * Hàm clearAllCache: thực thi chức năng xử lý của module
 */
export function clearAllCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
  }
}

/**
 * Định dạng thời gian đã lưu cache sang chuỗi hiển thị thân thiện
 */
export function formatCacheAge(cachedAt) {
  if (!cachedAt) return ''
  const minutes = Math.floor((Date.now() - cachedAt) / 60000)
  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}
