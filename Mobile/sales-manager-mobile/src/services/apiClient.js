import { BASE_URL } from './config'

export { BASE_URL }

export async function request(path, { body, headers, ...options } = {}) {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`
  const res = await fetch(url, {
    // Không như trình duyệt, fetch của React Native tự gửi/lưu cookie theo native
    // cookie jar của hệ điều hành (không cần "credentials: include"), nên cookie
    // access_token (HttpOnly) từ backend vẫn được đính kèm tự động ở các lần gọi sau.
    headers: { 'Content-Type': 'application/json', ...headers },
    ...options,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  if (!res.ok) throw new Error(data?.message || `Lỗi ${res.status}`)
  return data
}
