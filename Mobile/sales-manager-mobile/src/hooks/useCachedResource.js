import { useCallback, useEffect, useRef, useState } from 'react'
import { readCache, writeCache } from '../services/cache'
import { useNetwork } from '../context/network-context'

/**
 * Hook nạp dữ liệu cache offline tức thì và đồng bộ ngầm qua API cho ứng dụng Mobile
 */
export function useCachedResource(cacheKey, fetcher, { enabled = true } = {}) {
  const { isOnline, onReconnect } = useNetwork()

  const [data, setData] = useState(null)
  const [cachedAt, setCachedAt] = useState(null)
  const [isStale, setIsStale] = useState(false)
  const [loading, setLoading] = useState(enabled)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

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
      setIsStale(true)
    } finally {
      if (!mounted.current) return
      setLoading(false)
      setRefreshing(false)
    }
  }, [cacheKey])

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
        setIsStale(true)
        setLoading(false)
      }
      fetchFromNetwork()
    })

    return () => { cancelled = true }
  }, [cacheKey, enabled, fetchFromNetwork])

  useEffect(() => {
    if (!enabled) return
    return onReconnect(() => fetchFromNetwork())
  }, [enabled, onReconnect, fetchFromNetwork])

  const refresh = useCallback(() => fetchFromNetwork({ isRefresh: true }), [fetchFromNetwork])
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
