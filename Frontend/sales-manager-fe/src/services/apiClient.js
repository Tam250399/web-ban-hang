import { BASE_URL } from './config'

export { BASE_URL }

// Mạng yếu có thể treo một request vô thời hạn mà fetch không tự bỏ cuộc; không
// có mốc này thì spinner quay mãi và người dùng không có cách nào thoát.
const TIMEOUT_MS = 15000
const DOWNLOAD_TIMEOUT_MS = 60000

// ─────────────────────────────────────────────────────────────────────────
// Xử lý 401 tập trung
// Cookie phiên sống 7 ngày. Khi hết hạn, mọi màn đang mở đều nhận 401 và trước
// đây chỉ hiện toast "Lỗi 401" khó hiểu trong khi giao diện vẫn là đã đăng nhập.
// App.jsx đăng ký handler ở đây để đưa người dùng về trạng thái khách.
// ─────────────────────────────────────────────────────────────────────────
const AUTH_ENTRY_POINTS = ['/auth/login', '/auth/register']

let unauthorizedHandler = null

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn
}

/** Lỗi có phân loại để UI chọn thông báo phù hợp thay vì hiện mã HTTP thô. */
export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'server' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.kind = kind // 'network' | 'timeout' | 'auth' | 'server'
  }
}

export const isNetworkError = (err) => err?.kind === 'network' || err?.kind === 'timeout'

/** Gộp signal của caller (nếu có) với bộ đếm timeout — bên nào huỷ trước cũng dừng request. */
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
  // Caller chủ động huỷ (vd. component unmount) thì ném lại nguyên trạng để
  // không hiện toast lỗi cho thao tác người dùng đã bỏ.
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
    // /auth/login cũng trả 401 khi sai mật khẩu — đó là đăng nhập thất bại chứ
    // không phải phiên hết hạn, nên không được đá người dùng về trạng thái khách.
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
      credentials: 'include', // gửi kèm cookie access_token (HttpOnly) thay vì header Authorization thủ công
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

// resolveFileName(headers) là hàm tuỳ chọn để lấy tên file từ Content-Disposition.
export async function downloadFile(url, fallbackName, resolveFileName) {
  // File xuất có thể lớn nên cho hạn rộng hơn request JSON thường.
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
