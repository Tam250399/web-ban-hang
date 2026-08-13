import { BASE_URL } from './apiClient'

/**
 * Upload ảnh lên backend (POST /api/upload/image).
 * React Native dùng { uri, name, type } thay vì Web File object.
 * @param {{ uri: string, fileName?: string, mimeType?: string }} asset — asset từ expo-image-picker
 * @returns {Promise<string>} URL ảnh đã upload
 */
export async function uploadImage(asset) {
  const formData = new FormData()
  formData.append('file', {
    uri: asset.uri,
    name: asset.fileName || `photo_${Date.now()}.jpg`,
    type: asset.mimeType || 'image/jpeg',
  })

  const res = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    body: formData,
    // Không set Content-Type — fetch tự thêm boundary cho multipart/form-data.
    // Cookie access_token tự đính kèm qua native cookie jar.
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  if (!res.ok) throw new Error(data?.message || `Lỗi ${res.status}`)
  return data.url
}
