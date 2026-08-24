import AsyncStorage from '@react-native-async-storage/async-storage'

// Bộ nhớ đệm đơn giản trên AsyncStorage cho dữ liệu đọc từ API.
// Mục đích chính không phải tiết kiệm request mà là để app còn dùng được khi
// mất sóng: mở lên vẫn thấy danh sách sản phẩm / đơn hàng của lần vào trước.

const PREFIX = 'salesManagerCache:'

export const CACHE_KEYS = {
  products: 'products',
  myOrders: 'myOrders',
  homeCategories: 'homeCategories',
}

/**
 * @returns {Promise<{ data: any, cachedAt: number } | null>} null nếu chưa có
 * hoặc bản ghi hỏng (bị ghi dở, đổi format...).
 */
export async function readCache(key) {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.cachedAt !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export async function writeCache(key, data) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify({ data, cachedAt: Date.now() }))
  } catch {
    // Hết dung lượng hoặc lỗi ghi — cache chỉ là tối ưu, không được làm hỏng luồng chính.
  }
}

export async function clearCache(key) {
  try {
    await AsyncStorage.removeItem(PREFIX + key)
  } catch {
    // như trên
  }
}

/** Xoá toàn bộ cache — dùng khi đăng xuất để không lộ dữ liệu cho tài khoản khác. */
export async function clearAllCache() {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const ours = keys.filter((k) => k.startsWith(PREFIX))
    if (ours.length) await AsyncStorage.multiRemove(ours)
  } catch {
    // như trên
  }
}

/** "5 phút trước", "2 giờ trước"... để báo cho người dùng dữ liệu cũ cỡ nào. */
export function formatCacheAge(cachedAt) {
  if (!cachedAt) return ''
  const diffMs = Date.now() - cachedAt
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}
