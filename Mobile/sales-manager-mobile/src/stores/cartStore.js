import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const CART_STORAGE_KEY = 'salesManagerCart'

/**
 * Zustand store quản lý giỏ hàng trên ứng dụng di động với AsyncStorage
 */
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity = 1) => {
        const maxStock = product.stockQuantity ?? Infinity
        set((state) => {
          const existing = state.items.find((i) => i.productId === product.id)
          if (existing) {
            const nextQty = Math.min(existing.quantity + quantity, maxStock)
            return {
              items: state.items.map((i) =>
                i.productId === product.id ? { ...i, quantity: nextQty } : i
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                productId: product.id,
                productName: product.productName,
                productCode: product.productCode,
                unit: product.unitTypeName || product.unit,
                price: product.price,
                imageUrl: product.imageUrl,
                maxStock,
                quantity: Math.max(1, Math.min(quantity, maxStock)),
              },
            ],
          }
        })
      },

      updateQuantity: (productId, quantity) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.productId === productId
              ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
              : i
          ),
        }))
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }))
      },

      clear: () => set({ items: [] }),

      getTotalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, i) => sum + i.quantity * i.price, 0),
    }),
    {
      name: CART_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)

/**
 * Hook tương thích ngược useCart() cho mobile
 */
export function useCart() {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const clear = useCartStore((s) => s.clear)

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.price, 0)

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    totalCount,
    totalPrice,
  }
}
