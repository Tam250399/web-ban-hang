export { useAuth, useAuthStore, GUEST_USER, BIOMETRIC_STORAGE_KEY } from '../stores/authStore'

export function AuthProvider({ children }) {
  return children
}
