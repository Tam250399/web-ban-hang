import { BASE_URL, request } from './apiClient'

const URL = `${BASE_URL}/customer`

export const customerService = {
  getAll: () => request(URL),
  getById: (id) => request(`${URL}/${id}`),
  create: (data) => request(URL, { method: 'POST', body: data }),
  update: (id, data) => request(`${URL}/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`${URL}/${id}`, { method: 'DELETE' }),
}
