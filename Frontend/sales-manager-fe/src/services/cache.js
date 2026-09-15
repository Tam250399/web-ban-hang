
const PREFIX = 'salesManagerCache:'

export const CACHE_KEYS = {
  products: 'products',
  myOrders: 'myOrders',
}

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
  }
}

export function clearAllCache() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k))
  } catch {
  }
}

export function formatCacheAge(cachedAt) {
  if (!cachedAt) return ''
  const minutes = Math.floor((Date.now() - cachedAt) / 60000)
  if (minutes < 1) return 'vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  return `${Math.floor(hours / 24)} ngày trước`
}
