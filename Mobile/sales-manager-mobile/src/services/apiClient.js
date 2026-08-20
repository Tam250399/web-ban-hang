import { BASE_URL } from './config'

export { BASE_URL }

// Mạng di động có thể "treo" một request vô hạn (sóng yếu, chuyển 4G <-> WiFi,
// server không phản hồi) mà fetch không tự bỏ cuộc. Không có mốc thời gian này
// thì spinner quay mãi và người dùng không có cách nào thoát ngoài kill app.
const TIMEOUT_MS = 15000

// ─────────────────────────────────────────────────────────────────────────
// Xử lý 401 tập trung
// Cookie phiên sống 7 ngày; khi hết hạn, mọi màn hình đang mở đều nhận 401 và
// trước đây chỉ hiện toast "Lỗi 401" khó hiểu. AuthProvider đăng ký ở đây để
// đưa người dùng về trạng thái khách ngay khi phát hiện phiên đã hết.
// ─────────────────────────────────────────────────────────────────────────
const AUTH_ENTRY_POINTS = ['/auth/login', '/auth/register']

let unauthorizedHandler = null

export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn
}

/** Báo cho AuthProvider biết phiên đã hết hạn (uploadService dùng fetch riêng). */
export function notifyUnauthorized() {
  unauthorizedHandler?.()
}

/** Lỗi có kèm phân loại để UI chọn thông báo phù hợp thay vì hiện mã HTTP thô. */
export class ApiError extends Error {
  constructor(message, { status = 0, kind = 'server' } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.kind = kind // 'network' | 'timeout' | 'auth' | 'server'
  }
}

export const isNetworkError = (err) => err?.kind === 'network' || err?.kind === 'timeout'

export async function request(path, { body, headers, signal, ...options } = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`

  // Gộp signal của caller (nếu có) với bộ đếm timeout: bên nào huỷ trước cũng
  // dừng được request.
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  const onExternalAbort = () => controller.abort()
  signal?.addEventListener('abort', onExternalAbort)

  let res
  try {
    res = await fetch(url, {
      // Không như trình duyệt, fetch của React Native tự gửi/lưu cookie theo native
      // cookie jar của hệ điều hành (không cần "credentials: include"), nên cookie
      // access_token (HttpOnly) từ backend vẫn được đính kèm tự động ở các lần gọi sau.
      headers: { 'Content-Type': 'application/json', ...headers },
      signal: controller.signal,
      ...options,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    })
  } catch (err) {
    // Caller chủ động huỷ (vd. màn hình unmount) thì ném lại nguyên trạng để
    // không hiện toast lỗi cho một thao tác người dùng đã bỏ.
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
    // /auth/login cũng trả 401 khi sai mật khẩu — đó là thao tác đăng nhập thất
    // bại chứ không phải phiên hết hạn, nên không được đá người dùng về guest.
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
