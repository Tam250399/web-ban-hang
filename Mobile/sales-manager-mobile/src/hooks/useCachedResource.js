import { useCallback, useEffect, useRef, useState } from 'react'
import { readCache, writeCache } from '../services/cache'
import { useNetwork } from '../context/network-context'

/**
 * Cache-then-network: đọc bản lưu trên máy hiện ra ngay, đồng thời gọi API nền
 * để cập nhật. Mất sóng thì vẫn còn dữ liệu lần trước để xem thay vì màn trắng.
 *
 * @param {string} cacheKey khoá trong src/services/cache.js
 * @param {() => Promise<any>} fetcher hàm gọi API
 * @param {{ enabled?: boolean }} options enabled=false thì không đọc/không gọi
 *   (vd. khách chưa đăng nhập thì không có đơn hàng để tải)
 */
export function useCachedResource(cacheKey, fetcher, { enabled = true } = {}) {
  const { isOnline, onReconnect } = useNetwork()

  const [data, setData] = useState(null)
  const [cachedAt, setCachedAt] = useState(null)
  // isStale: đang hiện dữ liệu từ cache và lần gọi API gần nhất chưa thành công.
  const [isStale, setIsStale] = useState(false)
  const [loading, setLoading] = useState(enabled)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // fetcher thường là arrow function tạo mới mỗi render; giữ qua ref để không
  // phải bắt caller bọc useCallback mới dùng được hook này.
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  const fetchFromNetwork = useCallback(async ({ isRefresh = false } = {}) => {
    if (isRefresh) setRefreshing(true)
    try {
      const fresh = await fetcherRef.current()
      if (!mounted.current) return
      setData(fresh)
      setError(null)
      setIsStale(false)
      const now = Date.now()
      setCachedAt(now)
      writeCache(cacheKey, fresh)
    } catch (err) {
      if (!mounted.current) return
      setError(err)
      // Còn dữ liệu cache thì giữ nguyên trên màn hình và chỉ đánh dấu là cũ —
      // xoá đi để hiện lỗi là bước lùi so với việc cho người dùng xem bản cũ.
      setIsStale(true)
    } finally {
      if (!mounted.current) return
      setLoading(false)
      setRefreshing(false)
    }
  }, [cacheKey])

  // Nạp lần đầu: cache trước, mạng sau.
  useEffect(() => {
    if (!enabled) {
      setLoading(false)
      return
    }
    let cancelled = false

    readCache(cacheKey).then((cached) => {
      if (cancelled || !mounted.current) return
      if (cached) {
        setData(cached.data)
        setCachedAt(cached.cachedAt)
        setIsStale(true)   // sẽ chuyển thành false khi request nền trả về
        setLoading(false)  // đã có gì đó để hiện, không cần chặn màn hình nữa
      }
      fetchFromNetwork()
    })

    return () => { cancelled = true }
  }, [cacheKey, enabled, fetchFromNetwork])

  // Có mạng trở lại thì tự đồng bộ, không bắt người dùng kéo refresh thủ công.
  useEffect(() => {
    if (!enabled) return
    return onReconnect(() => fetchFromNetwork())
  }, [enabled, onReconnect, fetchFromNetwork])

  const refresh = useCallback(() => fetchFromNetwork({ isRefresh: true }), [fetchFromNetwork])
  const reload = useCallback(() => fetchFromNetwork(), [fetchFromNetwork])

  return {
    data,
    cachedAt,
    // Chỉ coi là "đang xem bản cũ" khi thực sự có dữ liệu cache và chưa làm mới được.
    isStale: isStale && data != null,
    loading,
    refreshing,
    error,
    isOnline,
    refresh,
    reload,
    setData,
  }
}
