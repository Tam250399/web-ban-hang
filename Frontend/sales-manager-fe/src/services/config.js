
/**
 * Hàm stripTrailingSlash: thực thi chức năng xử lý của module
 */
const stripTrailingSlash = (value) => String(value).replace(/\/+$/, '')

const API_ORIGIN = import.meta.env.VITE_API_URL
  ? stripTrailingSlash(import.meta.env.VITE_API_URL)
  : ''

export const BASE_URL = `${API_ORIGIN}/api`
export const HUB_URL = `${API_ORIGIN}/chathub`

const MEDIA_ORIGIN = import.meta.env.VITE_MEDIA_URL
  ? stripTrailingSlash(import.meta.env.VITE_MEDIA_URL)
  : ''

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

const mediaCache = new Map()

/**
 * Hàm resolveMediaUrl: thực thi chức năng xử lý của module
 */
export function resolveMediaUrl(url) {
  if (!url) return url
  if (url.startsWith('blob:') || url.startsWith('data:')) return url

  const cached = mediaCache.get(url)
  if (cached !== undefined) return cached

  let resolved = url
  try {
    const parsed = new URL(url, window.location.origin)
    if (LOCAL_HOSTS.has(parsed.hostname)) {
      if (MEDIA_ORIGIN) {
        resolved = `${MEDIA_ORIGIN}${parsed.pathname}${parsed.search}`
      } else {
        parsed.hostname = window.location.hostname
        resolved = parsed.toString()
      }
    }
  } catch {
  }

  mediaCache.set(url, resolved)
  return resolved
}
