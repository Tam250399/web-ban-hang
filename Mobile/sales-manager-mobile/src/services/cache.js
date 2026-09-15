import AsyncStorage from '@react-native-async-storage/async-storage'

const PREFIX = 'salesManagerCache:'

export const CACHE_KEYS = {
  products: 'products',
  myOrders: 'myOrders',
  homeCategories: 'homeCategories',
  contact: 'contact',
}

/**
 * Hàm readCache: thực thi chức năng xử lý của module
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

/**
 * Hàm writeCache: thực thi chức năng xử lý của module
 */
export async function writeCache(key, data) {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify({ data, cachedAt: Date.now() }))
  } catch {
  }
}

/**
 * Hàm clearCache: thực thi chức năng xử lý của module
 */
export async function clearCache(key) {
  try {
    await AsyncStorage.removeItem(PREFIX + key)
  } catch {
  }
}

/**
 * Hàm clearAllCache: thực thi chức năng xử lý của module
 */
export async function clearAllCache() {
  try {
    const keys = await AsyncStorage.getAllKeys()
    const ours = keys.filter((k) => k.startsWith(PREFIX))
    if (ours.length) await AsyncStorage.multiRemove(ours)
  } catch {
  }
}

/**
 * Hàm formatCacheAge: thực thi chức năng xử lý của module
 */
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
