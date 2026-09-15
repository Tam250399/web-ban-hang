import { BASE_URL, request } from './apiClient'

const AUTH = `${BASE_URL}/auth`

/**
 * Dịch vụ API xác thực người dùng (đăng nhập, đăng ký, đăng xuất, lấy thông tin cá nhân)
 */
export const authService = {
  login:    (username, password) => request(`${AUTH}/login`, { method: 'POST', body: { username, password } }),
  register: (data)               => request(`${AUTH}/register`, { method: 'POST', body: data }),
  logout:   ()                   => request(`${AUTH}/logout`, { method: 'POST' }),
  me:       ()                   => request(`${AUTH}/me`),
}
