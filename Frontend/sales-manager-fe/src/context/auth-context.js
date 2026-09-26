import { createContext } from 'react'
export { useAuth, useAuthStore, GUEST_USER, USER_STORAGE_KEY } from '../stores/authStore'

export const AuthContext = createContext(null)
