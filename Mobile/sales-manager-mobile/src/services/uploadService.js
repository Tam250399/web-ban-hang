import { ApiError, BASE_URL, notifyUnauthorized } from './apiClient'

const UPLOAD_TIMEOUT_MS = 45000

export async function uploadImage(asset) {
  const formData = new FormData()
  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName || `photo_${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  })

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS)

  let res
  try {
    res = await fetch(`${BASE_URL}/upload/image`, {
      method: 'POST',
      body: formData,
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
  const data = isJson ? await res.json() : null

  if (res.status === 401) {
    notifyUnauthorized()
    throw new ApiError('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.', { status: 401, kind: 'auth' })
  }
  if (!res.ok) throw new ApiError(data?.message || `Lỗi ${res.status}`, { status: res.status })

  return data.url
}
