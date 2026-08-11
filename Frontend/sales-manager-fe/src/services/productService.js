import { BASE_URL, request } from './apiClient'

const URL = `${BASE_URL}/product`

async function downloadFile(url, fallbackName) {
  const res = await fetch(url)
  if (!res.ok) {
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json() : null
    throw new Error(data?.message || `Lỗi ${res.status}`)
  }
  const blob = await res.blob()
  const objectUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = fallbackName
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(objectUrl)
}

export const productService = {
  getAll:        ()         => request(URL),
  getStatistics: ()         => request(`${URL}/statistics`),
  create:        (data)     => request(URL, { method: 'POST', body: data }),
  update:        (id, data) => request(`${URL}/${id}`, { method: 'PUT', body: data }),
  remove:        (id)       => request(`${URL}/${id}`, { method: 'DELETE' }),

  downloadTemplate: () => downloadFile(`${URL}/import-template`, 'MauNhapSanPham.xlsx'),
  exportAll:        () => downloadFile(`${URL}/export`, 'DanhSachSanPham.xlsx'),

  previewImport: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${URL}/import/preview`, { method: 'POST', body: formData })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json() : null
    if (!res.ok) throw new Error(data?.message || `Lỗi ${res.status}`)
    return data
  },

  commitImport: (rows) => request(`${URL}/import/commit`, { method: 'POST', body: { rows } }),
}
