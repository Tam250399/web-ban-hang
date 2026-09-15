import { BASE_URL, request, downloadFile } from './apiClient'

const URL = `${BASE_URL}/SalesInvoice`

/**
 * Hàm resolveInvoiceFileName: thực thi chức năng xử lý của module
 */
function resolveInvoiceFileName(headers) {
  const disposition = headers.get('content-disposition') || ''
  const utf8Match = disposition.match(/filename\*=UTF-8''(.+?)(?:;|$)/i)
  const asciiMatch = disposition.match(/filename="?([^";]+)"?/)
  return utf8Match ? decodeURIComponent(utf8Match[1].trim()) : asciiMatch ? asciiMatch[1].trim() : null
}

/**
 * Dịch vụ API quản lý phiếu bán hàng và xuất báo cáo Excel
 */
export const salesInvoiceService = {
  getAll: () => request(URL),
  getById: (id) => request(`${URL}/${id}`),
  create: (data) => request(URL, { method: 'POST', body: data }),
  update: (id, data) => request(`${URL}/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`${URL}/${id}`, { method: 'DELETE' }),

  downloadExport: (id) => downloadFile(`${URL}/${id}/export`, `PhieuBanHang_${id}.xlsx`, resolveInvoiceFileName),

  downloadBulkExport: (ids, customerName) => {
    const params = new URLSearchParams({ ids: ids.join(',') })
    const safeName = (customerName || 'KhachHang').replace(/[<>:"/\\|?*]/g, '_')
    return downloadFile(`${URL}/export?${params.toString()}`, `PhieuBanHang_${safeName}.xlsx`, resolveInvoiceFileName)
  },
}
