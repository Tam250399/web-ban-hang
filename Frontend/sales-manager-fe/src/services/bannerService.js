import { BASE_URL, request } from './apiClient'

const BANNER = `${BASE_URL}/banner`

export const bannerService = {
  getActive: ()         => request(BANNER),
  getAll:    ()         => request(`${BANNER}/all`),
  create:    (data)     => request(BANNER, { method: 'POST', body: data }),
  update:    (id, data) => request(`${BANNER}/${id}`, { method: 'PUT', body: data }),
  delete:    (id)       => request(`${BANNER}/${id}`, { method: 'DELETE' }),
}
