import { BASE_URL, request } from './apiClient'

const URL = `${BASE_URL}/product`

export const productService = {
  getAll:        ()         => request(URL),
  getStatistics: ()         => request(`${URL}/statistics`),
  create:        (data)     => request(URL, { method: 'POST', body: data }),
  update:        (id, data) => request(`${URL}/${id}`, { method: 'PUT', body: data }),
  remove:        (id)       => request(`${URL}/${id}`, { method: 'DELETE' }),
}
