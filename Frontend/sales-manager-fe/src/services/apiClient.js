import { BASE_URL } from './config'

export { BASE_URL }

const TIMEOUT_MS = 15000
const DOWNLOAD_TIMEOUT_MS = 60000

const AUTH_ENTRY_POINTS = ['/auth/login', '/auth/register']

let unauthorizedHandler = null

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn
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

function withTimeout(signal, timeoutMs) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const onExternalAbort = () => controller.abort()
  signal?.addEventListener('abort', onExternalAbort)
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onExternalAbort)
    },
  }
}

function toFetchError(err, externalSignal) {
  if (externalSignal?.aborted) return err
  if (err?.name === 'AbortError') {
    return new ApiError('Máy chủ phản hồi quá lâu. Vui lòng thử lại.', { kind: 'timeout' })
  }
  return new ApiError('Không có kết nối tới máy chủ. Kiểm tra lại mạng của bạn.', { kind: 'network' })
}

async function readError(res, url) {
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : null

  if (res.status === 401) {
    if (!AUTH_ENTRY_POINTS.some((p) => url.includes(p))) unauthorizedHandler?.()
    return new ApiError(
      data?.message || 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.',
      { status: 401, kind: 'auth' }
    )
  }
  return new ApiError(data?.message || `Lỗi ${res.status}`, { status: res.status })
}

export async function request(url, { body, headers, signal, ...options } = {}) {
  const { signal: timeoutSignal, cleanup } = withTimeout(signal, TIMEOUT_MS)

  let res
  try {
    res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...headers },
      signal: timeoutSignal,
      ...options,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch (err) {
    throw toFetchError(err, signal)
  } finally {
    cleanup()
  }

  if (!res.ok) throw await readError(res, url)

  const isJson = res.headers.get('content-type')?.includes('application/json')
  return isJson ? res.json() : null
}

export async function downloadFile(url, fallbackName, resolveFileName) {
  const { signal, cleanup } = withTimeout(null, DOWNLOAD_TIMEOUT_MS)

  let res
  try {
    res = await fetch(url, { credentials: 'include', signal })
  } catch (err) {
    throw toFetchError(err, null)
  } finally {
    cleanup()
  }

  if (!res.ok) throw await readError(res, url)

  const blob = await res.blob()
  const fileName = resolveFileName ? resolveFileName(res.headers) || fallbackName : fallbackName

  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}
