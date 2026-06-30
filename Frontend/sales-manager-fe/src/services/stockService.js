import { BASE_URL, request } from './apiClient'

const URL = `${BASE_URL}/stock`

export const stockService = {
  getAll: ()     => request(URL),
  create: (data) => request(URL, { method: 'POST', body: data }),
}
