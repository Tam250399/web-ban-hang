export { useNetwork, useNetworkStore } from '../stores/networkStore'

/**
 * Provider bọc tương thích ngược (Zustand không bắt buộc bọc Provider)
 */
export function NetworkProvider({ children }) {
  return children
}
