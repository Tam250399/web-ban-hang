import { BASE_URL } from './config'

export { BASE_URL }

const TIMEOUT_MS = 15000

const AUTH_ENTRY_POINTS = ['/auth/login', '/auth/register']

let unauthorizedHandler = null

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn
}

export function notifyUnauthorized() {
  unauthorizedHandler?.()
}

export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'server' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.kind = kind
  }
}

export const isNetworkError = (err) => err?.kind === 'network' || err?.kind === 'timeout'

export async function request(path, { body, headers, signal, ...options } = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const onExternalAbort = () => controller.abort()
  signal?.addEventListener('abort', onExternalAbort)

  let res
  try {
    res = await fetch(url, {
      headers: { 'Content-Type': 'application/json', ...headers },
      signal: controller.signal,
      ...options,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch (err) {
    if (signal?.aborted) throw err
    if (err?.name === 'AbortError') {
      throw new ApiError('Máy chủ phản hồi quá lâu. Vui lòng thử lại.', { kind: 'timeout' })
    }
    throw new ApiError('Không có kết nối tới máy chủ. Kiểm tra lại mạng của bạn.', { kind: 'network' })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', onExternalAbort)
  }

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null

  if (res.status === 401) {
    if (!AUTH_ENTRY_POINTS.some((p) => url.includes(p))) unauthorizedHandler?.()
    throw new ApiError(
      data?.message || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
      { status: 401, kind: 'auth' }
    )
  }

  if (!res.ok) {
    throw new ApiError(data?.message || `Lỗi ${res.status}`, { status: res.status })
  }

  return data
}
