import { createContext, useContext } from 'react'

export const NetworkContext = createContext(null)

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used within a NetworkProvider')
  return ctx
}
