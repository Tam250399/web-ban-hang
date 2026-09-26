import { createContext } from 'react'
export { useCart, useCartStore, CART_STORAGE_KEY } from '../stores/cartStore'

export const CartContext = createContext(null)
