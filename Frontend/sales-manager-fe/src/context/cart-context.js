import { createContext, useContext } from 'react'

export const CartContext = createContext(null)

/**
 * Hook quản lý giỏ hàng mua sắm (thêm, sửa, xóa, tính tổng)
 */
export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within a CartProvider')
  return ctx
}
