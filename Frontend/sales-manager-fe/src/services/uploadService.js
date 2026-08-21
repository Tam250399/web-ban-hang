import { ApiError, BASE_URL } from './apiClient'

// Upload ảnh nặng hơn request JSON thường nên cho hạn rộng hơn 15s của apiClient.
const UPLOAD_TIMEOUT_MS = 45000

export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)

  let res
  try {
    res = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData,
      credentials: 'include',
      signal: controller.signal,
    })
  } catch (err) {
    if (err?.name === 'AbortError') {
      throw new ApiError('Tải ảnh lên quá lâu. Thử lại với ảnh nhỏ hơn.', { kind: 'timeout' })
    }
    throw new ApiError('Không có kết nối tới máy chủ. Kiểm tra lại mạng của bạn.', { kind: 'network' })
  } finally {
    clearTimeout(timer)
  }

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json().catch(() => null) : null
  if (!res.ok) throw new ApiError(data?.message || `Lỗi ${res.status}`, { status: res.status })
  return data.url
}
