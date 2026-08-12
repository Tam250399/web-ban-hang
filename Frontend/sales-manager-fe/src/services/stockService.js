import { BASE_URL, request, downloadFile } from './apiClient'

const URL = `${BASE_URL}/stock`

export const stockService = {
  getAll: ()          => request(URL),
  create: (data)      => request(URL, { method: 'POST', body: data }),
  update: (id, data)  => request(`${URL}/${id}`, { method: 'PUT', body: data }),
  remove: (id)        => request(`${URL}/${id}`, { method: 'DELETE' }),

  downloadTemplate: () => downloadFile(`${URL}/import-template`, 'MauNhapKho.xlsx'),

  previewImport: async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${URL}/import/preview`, { method: 'POST', body: formData, credentials: 'include' })
    const isJson = res.headers.get('content-type')?.includes('application/json')
    const data = isJson ? await res.json() : null
    if (!res.ok) throw new Error(data?.message || `Lỗi ${res.status}`)
    return data
  },

  commitImport: (rows) => request(`${URL}/import/commit`, { method: 'POST', body: { rows } }),
}
