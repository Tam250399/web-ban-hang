import { request } from './apiClient'

const AUTH = '/auth'

export const authService = {
  login:    (username, password) => request(`${AUTH}/login`, { method: 'POST', body: { username, password } }),
  register: (data)               => request(`${AUTH}/register`, { method: 'POST', body: data }),
  logout:   ()                   => request(`${AUTH}/logout`, { method: 'POST' }),
  me:       ()                   => request(`${AUTH}/me`),
}
