import { useCallback, useEffect, useRef, useState } from 'react'
import { readCache, writeCache } from '../services/cache'
import { useNetwork } from '../context/network-context'

/**
 * Cache-then-network: đọc bản lưu trên máy hiện ra ngay, đồng thời gọi API nền
 * để cập nhật. Mất mạng thì vẫn còn dữ liệu lần trước để xem thay vì trang trắng.
 *
 * localStorage đọc đồng bộ nên khác bản mobile: có cache thì ngay lượt render
 * ĐẦU TIÊN đã có dữ liệu, không hề nháy qua trạng thái loading.
 *
 * @param {string} cacheKey khoá trong src/services/cache.js
 * @param {() => Promise<any>} fetcher hàm gọi API
 * @param {{ enabled?: boolean }} options enabled=false thì không đọc/không gọi
 */
export function useCachedResource(cacheKey, fetcher, { enabled = true } = {}) {
  const { isOnline, onReconnect } = useNetwork()

  // Hàm khởi tạo lười của useState chỉ chạy đúng một lần ở lần render đầu —
  // đúng chỗ để đọc cache đồng bộ mà không đụng vào ref lúc render.
  const [initial] = useState(() => (enabled ? readCache(cacheKey) : null))

  const [data, setData] = useState(initial?.data ?? null)
  const [cachedAt, setCachedAt] = useState(initial?.cachedAt ?? null)
  // isStale: đang hiện dữ liệu cache và lần gọi API gần nhất chưa thành công.
  const [isStale, setIsStale] = useState(!!initial)
  const [loading, setLoading] = useState(enabled && !initial)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  // fetcher thường là arrow function tạo mới mỗi render; giữ qua ref để không
  // bắt caller phải bọc useCallback mới dùng được hook này. Gán trong effect
  // chứ không gán lúc render (ghi ref khi render là hành vi không an toàn với
  // chế độ đồng thời của React).
  const fetcherRef = useRef(fetcher)
  useEffect(() => { fetcherRef.current = fetcher })

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  // Không nhận cờ isRefresh nữa: mọi setState trong đây đều nằm sau `await`,
  // nhờ vậy gọi từ useEffect không tạo ra lượt render dây chuyền nào.
  const fetchFromNetwork = useCallback(async () => {
    try {
      const fresh = await fetcherRef.current()
      if (!mounted.current) return
      setData(fresh)
      setError(null)
      setIsStale(false)
      setCachedAt(Date.now())
      writeCache(cacheKey, fresh)
    } catch (err) {
      if (!mounted.current) return
      setError(err)
      // Còn dữ liệu cache thì giữ nguyên trên màn hình và chỉ đánh dấu là cũ —
      // xoá đi để hiện lỗi là bước lùi so với cho người dùng xem bản cũ.
      setIsStale(true)
    }
    // Cố tình không dùng finally: `return` bên trong finally sẽ nuốt mất cả
    // exception lẫn giá trị trả về của try/catch (eslint no-unsafe-finally).
    if (!mounted.current) return
    setLoading(false)
    setRefreshing(false)
  }, [cacheKey])

  useEffect(() => {
    // enabled=false thì loading vốn đã khởi tạo là false, không cần setState.
    if (!enabled) return
    fetchFromNetwork()
  }, [enabled, fetchFromNetwork])

  // Có mạng trở lại thì tự đồng bộ, không bắt người dùng F5 thủ công.
  useEffect(() => {
    if (!enabled) return
    return onReconnect(() => fetchFromNetwork())
  }, [enabled, onReconnect, fetchFromNetwork])

  const refresh = useCallback(() => {
    setRefreshing(true)
    return fetchFromNetwork()
  }, [fetchFromNetwork])
  const reload = useCallback(() => fetchFromNetwork(), [fetchFromNetwork])

  return {
    data,
    cachedAt,
    // Chỉ coi là "đang xem bản cũ" khi thực sự có dữ liệu và chưa làm mới được.
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
