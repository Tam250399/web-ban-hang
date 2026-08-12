import { BASE_URL, request } from './apiClient'

const AUTH = `${BASE_URL}/auth`

export const authService = {
  login:    (username, password) => request(`${AUTH}/login`, { method: 'POST', body: { username, password } }),
  register: (data)               => request(`${AUTH}/register`, { method: 'POST', body: data }),
  logout:   ()                   => request(`${AUTH}/logout`, { method: 'POST' }),
  // Xác nhận phiên đăng nhập hiện tại bằng cookie HttpOnly (không đọc/tin dữ liệu client tự lưu).
  me:       ()                   => request(`${AUTH}/me`),
}
