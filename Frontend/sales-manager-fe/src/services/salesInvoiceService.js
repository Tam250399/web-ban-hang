import { BASE_URL, request, downloadFile } from './apiClient'

const URL = `${BASE_URL}/SalesInvoice`

// Prefer filename*=UTF-8'' (RFC 5987) which preserves Vietnamese diacritics
function resolveInvoiceFileName(headers) {
  const disposition = headers.get('content-disposition') || ''
  const utf8Match = disposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/i)
  const asciiMatch = disposition.match(/filename="?([^";]+)"?/)
  return utf8Match ? decodeURIComponent(utf8Match[1].trim()) : asciiMatch ? asciiMatch[1].trim() : null
}

export const salesInvoiceService = {
  getAll: () => request(URL),
  getById: (id) => request(`${URL}/${id}`),
  create: (data) => request(URL, { method: 'POST', body: data }),
  update: (id, data) => request(`${URL}/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`${URL}/${id}`, { method: 'DELETE' }),

  downloadExport: (id) => downloadFile(`${URL}/${id}/export`, `PhieuBanHang_${id}.xlsx`, resolveInvoiceFileName),

  downloadBulkExport: (ids, customerName) => {
    // Không gửi preparedBy nữa — backend tự điền tên người lập từ danh tính đã
    // xác thực, client không được quyền quyết định trường truy vết này.
    const params = new URLSearchParams({ ids: ids.join(',') })
    const safeName = (customerName || 'KhachHang').replace(/[<>:"/\\|?*]/g, '_')
    return downloadFile(`${URL}/export?${params.toString()}`, `PhieuBanHang_${safeName}.xlsx`, resolveInvoiceFileName)
  },
}
