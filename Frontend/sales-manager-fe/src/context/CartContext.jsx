export { useCart, useCartStore, CART_STORAGE_KEY } from '../stores/cartStore'

/**
 * Provider bọc tương thích ngược (Zustand không bắt buộc bọc Provider)
 */
export function CartProvider({ children }) {
  return children
}
