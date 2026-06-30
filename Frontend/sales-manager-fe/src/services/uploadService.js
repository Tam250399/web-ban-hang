import { BASE_URL } from './apiClient'

export async function uploadImage(file) {
  const formData = new FormData()
  formData.append('file', file)

  const res = await fetch(`${BASE_URL}/upload/image`, {
    method: 'POST',
    body: formData,
  })

  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  if (!res.ok) throw new Error(data?.message || `Lỗi ${res.status}`)
  return data.url
}
