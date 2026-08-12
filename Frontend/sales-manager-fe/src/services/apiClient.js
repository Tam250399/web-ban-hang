export const BASE_URL = '/api'

export async function request(url, { body, headers, ...options } = {}) {
  const res = await fetch(url, {
    credentials: 'include', // gửi kèm cookie access_token (HttpOnly) thay vì header Authorization thủ công
    headers: { 'Content-Type': 'application/json', ...headers },
    ...options,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  if (!res.ok) throw new Error(data?.message || `Lỗi ${res.status}`)
  return data
}

// resolveFileName(headers) là hàm tuỳ chọn để lấy tên file từ Content-Disposition.
export async function downloadFile(url, fallbackName, resolveFileName) {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) {
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json() : null
    throw new Error(data?.message || `Lỗi ${res.status}`)
  }
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
