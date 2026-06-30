export const BASE_URL = '/api'

export async function request(url, { body, ...options } = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  })
  const isJson = res.headers.get('content-type')?.includes('application/json')
  const data = isJson ? await res.json() : null
  if (!res.ok) throw new Error(data?.message || `Lỗi ${res.status}`)
  return data
}
