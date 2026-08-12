import { BASE_URL, request } from './apiClient'

const USER = `${BASE_URL}/User`
const ROLE = `${BASE_URL}/Role`

export const userService = {
  getUsers:       ()             => request(USER),
  createUser:     (data)         => request(USER, { method: 'POST', body: data }),
  updateUser:     (id, data)     => request(`${USER}/${id}`, { method: 'PUT', body: data }),
  updateUserRole: (id, roleId)   => request(`${USER}/${id}/role`, { method: 'PUT', body: { roleId } }),
  deleteUser:     (id)           => request(`${USER}/${id}`, { method: 'DELETE' }),
  getRoles:       ()             => request(ROLE),
}
