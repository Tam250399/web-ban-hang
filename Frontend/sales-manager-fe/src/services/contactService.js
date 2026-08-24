import { BASE_URL, request } from './apiClient'

const CONTACT = `${BASE_URL}/contact`

export const contactService = {
  getActive: ()         => request(`${CONTACT}/active`),
  getAll:    ()         => request(CONTACT),
  create:    (data)     => request(CONTACT, { method: 'POST', body: data }),
  update:    (id, data) => request(`${CONTACT}/${id}`, { method: 'PUT', body: data }),
  delete:    (id)       => request(`${CONTACT}/${id}`, { method: 'DELETE' }),
}
