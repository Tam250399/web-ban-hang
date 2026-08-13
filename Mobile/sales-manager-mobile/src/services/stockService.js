import { request } from './apiClient'

const URL = '/stock'

export const stockService = {
  getAll: () => request(URL),
  create: (data) => request(URL, { method: 'POST', body: data }),
  update: (id, data) => request(`${URL}/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`${URL}/${id}`, { method: 'DELETE' }),
}
