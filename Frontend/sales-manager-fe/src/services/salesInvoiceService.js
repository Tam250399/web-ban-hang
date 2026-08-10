import { BASE_URL, request } from './apiClient'

const URL = `${BASE_URL}/SalesInvoice`

async function downloadFile(url, fallbackName) {
  const res = await fetch(url)
  if (!res.ok) {
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json() : null
    throw new Error(data?.message || `Lỗi ${res.status}`)
  }
  const blob = await res.blob()
  const disposition = res.headers.get('content-disposition') || ''
  // Prefer filename*=UTF-8'' (RFC 5987) which preserves Vietnamese diacritics
  const utf8Match = disposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/i)
  const asciiMatch = disposition.match(/filename="?([^";]+)"?/)
  const fileName = utf8Match ? decodeURIComponent(utf8Match[1].trim()) : asciiMatch ? asciiMatch[1].trim() : fallbackName

  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}

export const salesInvoiceService = {
  getAll: () => request(URL),
  getById: (id) => request(`${URL}/${id}`),
  create: (data) => request(URL, { method: 'POST', body: data }),
  update: (id, data) => request(`${URL}/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`${URL}/${id}`, { method: 'DELETE' }),

  downloadExport: (id) => downloadFile(`${URL}/${id}/export`, `PhieuBanHang_${id}.xlsx`),

  downloadBulkExport: (ids, preparedByName, customerName) => {
    const params = new URLSearchParams({ ids: ids.join(',') })
    if (preparedByName) params.set('preparedBy', preparedByName)
    const safeName = (customerName || 'KhachHang').replace(/[<>:"/\\|?*]/g, '_')
    return downloadFile(`${URL}/export?${params.toString()}`, `PhieuBanHang_${safeName}.xlsx`)
  },
}
