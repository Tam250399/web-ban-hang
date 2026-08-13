import { request } from './apiClient'

const URL = '/order'

export const orderService = {
  create: (data) => request(URL, { method: 'POST', body: data }),
  getMine: () => request(`${URL}/mine`),
  getAll: (status) => request(status ? `${URL}?status=${encodeURIComponent(status)}` : URL),
  getById: (id) => request(`${URL}/${id}`),
  confirm: (id, data) => request(`${URL}/${id}/confirm`, { method: 'POST', body: data || {} }),
  cancel: (id, data) => request(`${URL}/${id}/cancel`, { method: 'POST', body: data || {} }),
  reorder: (id) => request(`${URL}/${id}/reorder`, { method: 'POST' }),
}
