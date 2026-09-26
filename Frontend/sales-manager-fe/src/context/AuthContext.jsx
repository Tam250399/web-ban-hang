export { useAuth, useAuthStore, GUEST_USER, USER_STORAGE_KEY } from '../stores/authStore'

/**
 * Provider bọc tương thích ngược (Zustand không bắt buộc bọc Provider)
 */
export function AuthProvider({ children }) {
  return children
}
