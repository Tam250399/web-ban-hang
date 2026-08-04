import { BASE_URL, request } from './apiClient'

const USER = `${BASE_URL}/User`
const ROLE = `${BASE_URL}/Role`

function authHeaders() {
  const token = localStorage.getItem('salesManagerToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const userService = {
  getUsers:       ()             => request(USER, { headers: authHeaders() }),
  createUser:     (data)         => request(USER, { method: 'POST', body: data, headers: authHeaders() }),
  updateUserRole: (id, roleId)   => request(`${USER}/${id}/role`, { method: 'PUT', body: { roleId }, headers: authHeaders() }),
  deleteUser:     (id)           => request(`${USER}/${id}`, { method: 'DELETE', headers: authHeaders() }),
  getRoles:       ()             => request(ROLE, { headers: authHeaders() }),
}
