import Constants from 'expo-constants'
import { Platform } from 'react-native'

const DEV_SERVER_PORT = 5000

function resolveDevHost() {
  const hostUri = Constants.expoConfig?.hostUri
  if (hostUri) {
    const host = hostUri.split(':')[0]
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host
  }
  if (Platform.OS === 'android') return '10.0.2.2'
  return 'localhost'
}

const extra = Constants.expoConfig?.extra ?? {}

function resolveProdServerUrl() {
  if (extra.apiUrl) return String(extra.apiUrl).replace(/\/+$/, '')
  const host = extra.apiHost ?? 'localhost'
  return extra.apiPort ? `http://${host}:${extra.apiPort}` : `https://${host}`
}

const usesNginxOrigin = Boolean(extra.apiUrl)

export const SERVER_URL = extra.apiUrl
  ? String(extra.apiUrl).replace(/\/+$/, '')
  : __DEV__
    ? `http://${resolveDevHost()}:${DEV_SERVER_PORT}`
    : resolveProdServerUrl()

export const API_HOST = (() => {
  try {
    return new URL(SERVER_URL).hostname
  } catch {
    return 'localhost'
  }
})()

export const BASE_URL = `${SERVER_URL}/api`
export const HUB_URL = `${SERVER_URL}/chathub`

if (__DEV__ && !SERVER_URL.startsWith('http')) {
  console.warn('[config] SERVER_URL không hợp lệ:', SERVER_URL)
}

const mediaUrlCache = new Map()

export function resolveMediaUrl(url) {
  if (!url) return url
  const cached = mediaUrlCache.get(url)
  if (cached !== undefined) return cached

  let resolved = url
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      resolved = usesNginxOrigin
        ? `${SERVER_URL}/media${parsed.pathname}${parsed.search}`
        : (() => {
            parsed.hostname = API_HOST
            return parsed.toString()
          })()
    }
  } catch {
  }
  mediaUrlCache.set(url, resolved)
  return resolved
}
