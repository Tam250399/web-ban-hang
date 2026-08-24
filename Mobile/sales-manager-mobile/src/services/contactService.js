import { request } from './apiClient'

const CONTACT = '/contact'

export const contactService = {
  getActive: () => request(`${CONTACT}/active`),
}
