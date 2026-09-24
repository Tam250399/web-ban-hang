import { ApiError, BASE_URL } from './apiClient'
import { compressAndConvertToWebP } from '../utils/imageOptimizer'

const UPLOAD_TIMEOUT_MS = 45000

/**
 * Tải file hình ảnh lên máy chủ MinIO qua API Upload (tự động tối ưu hóa sang WebP)
 */
export async function uploadImage(file) {
  // Tự động chuyển đổi và nén sang WebP ở client để giảm 50% - 80% dung lượng tải lên
  let fileToUpload = file
  try {
    fileToUpload = await compressAndConvertToWebP(file)
  } catch (e) {
    console.warn('Lỗi khi nén ảnh sang WebP client-side, sử dụng file gốc:', e)
  }

  const formData = new FormData()
  formData.append('file', fileToUpload)

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
