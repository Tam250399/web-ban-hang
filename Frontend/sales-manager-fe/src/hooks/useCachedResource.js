import { useCallback, useEffect, useRef, useState } from 'react'
import { readCache, writeCache } from '../services/cache'
import { useNetwork } from '../context/network-context'

/**
 * Hook nạp dữ liệu theo chiến lược cache-then-network, cho phép hiển thị bản lưu offline tức thì và tự làm mới qua API
 */
export function useCachedResource(cacheKey, fetcher, { enabled = true } = {}) {
  const { isOnline, onReconnect } = useNetwork()

  const [initial] = useState(() => (enabled ? readCache(cacheKey) : null))

  const [data, setData] = useState(initial?.data ?? null)
  const [cachedAt, setCachedAt] = useState(initial?.cachedAt ?? null)
  const [isStale, setIsStale] = useState(!!initial)
  const [loading, setLoading] = useState(enabled && !initial)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const fetcherRef = useRef(fetcher)
  useEffect(() => { fetcherRef.current = fetcher })

  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

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
      setIsStale(true)
    }
    if (!mounted.current) return
    setLoading(false)
    setRefreshing(false)
  }, [cacheKey])

  useEffect(() => {
    if (!enabled) return
    fetchFromNetwork()
  }, [enabled, fetchFromNetwork])

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
