import { request } from './apiClient'

const AUTH = '/auth'

export const authService = {
  login:       (username, password) => request(`${AUTH}/login`, { method: 'POST', body: { username, password } }),
  socialLogin: (data)               => request(`${AUTH}/social-login`, { method: 'POST', body: data }),
  verify2Fa:   (tempToken, code)    => request(`${AUTH}/verify-2fa`, { method: 'POST', body: { tempToken, code } }),
  resend2Fa:   (tempToken)          => request(`${AUTH}/resend-2fa`, { method: 'POST', body: { tempToken } }),
  register:    (data)               => request(`${AUTH}/register`, { method: 'POST', body: data }),
  logout:      ()                   => request(`${AUTH}/logout`, { method: 'POST' }),
  me:          ()                   => request(`${AUTH}/me`),
}
