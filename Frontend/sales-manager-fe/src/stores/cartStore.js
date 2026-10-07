import { create } from 'zustand'
import { useAuthStore } from './authStore'

export const CART_STORAGE_KEY = 'salesManagerCart'

/**
 * Tạo key lưu trữ giỏ hàng riêng biệt theo từng tài khoản
 * - Người dùng đăng nhập: salesManagerCart_user_{id/username}
 * - Khách vãng lai: salesManagerCart_guest
 */
export function getCartStorageKey(user) {
  if (user && user.username && user.username !== 'guest') {
    const identifier = user.id ?? user.username
    return `salesManagerCart_user_${identifier}`
  }
  return 'salesManagerCart_guest'
}

/**
 * Đọc dữ liệu giỏ hàng từ localStorage cho tài khoản cụ thể
 */
function loadCartForUser(user) {
  try {
    const key = getCartStorageKey(user)
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
    if (Array.isArray(parsed?.items)) return parsed.items
    return []
  } catch {
    return []
  }
}

/**
 * Lưu dữ liệu giỏ hàng vào localStorage cho tài khoản cụ thể
 */
function saveCartForUser(user, items) {
  try {
    const key = getCartStorageKey(user)
    localStorage.setItem(key, JSON.stringify(items))
  } catch {}
}

// Xóa key giỏ hàng dùng chung cũ (nếu có) để tránh xung đột dữ liệu giữa các tài khoản
try {
  localStorage.removeItem('salesManagerCart')
} catch {}

/**
 * Zustand store quản lý giỏ hàng độc lập theo từng tài khoản
 */
export const useCartStore = create((set, get) => {
  const initialUser = useAuthStore.getState().user
  const initialItems = loadCartForUser(initialUser)

  return {
    currentUser: initialUser,
    items: initialItems,

    /**
     * Chuyển đổi tài khoản đang hoạt động và nạp giỏ hàng tương ứng
     */
    switchUser: (newUser) => {
      const { currentUser, items } = get()
      // Lưu lại giỏ hàng của tài khoản trước khi chuyển
      saveCartForUser(currentUser, items)

      // Nạp giỏ hàng của tài khoản mới
      const nextItems = loadCartForUser(newUser)
      set({ currentUser: newUser, items: nextItems })
    },

    addItem: (product, quantity = 1) => {
      const maxStock = product.stockQuantity ?? Infinity
      set((state) => {
        const existing = state.items.find((i) => i.productId === product.id)
        let nextItems
        if (existing) {
          const nextQty = Math.min(existing.quantity + quantity, maxStock)
          nextItems = state.items.map((i) =>
            i.productId === product.id ? { ...i, quantity: nextQty } : i
          )
        } else {
          nextItems = [
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
          ]
        }
        saveCartForUser(state.currentUser, nextItems)
        return { items: nextItems }
      })
    },

    updateQuantity: (productId, quantity) => {
      set((state) => {
        const nextItems = state.items.map((i) =>
          i.productId === productId
            ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) }
            : i
        )
        saveCartForUser(state.currentUser, nextItems)
        return { items: nextItems }
      })
    },

    removeItem: (productId) => {
      set((state) => {
        const nextItems = state.items.filter((i) => i.productId !== productId)
        saveCartForUser(state.currentUser, nextItems)
        return { items: nextItems }
      })
    },

    clear: () => {
      set((state) => {
        saveCartForUser(state.currentUser, [])
        return { items: [] }
      })
    },

    getTotalCount: () => get().items.length,
    getTotalQuantity: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    getTotalPrice: () => get().items.reduce((sum, i) => sum + i.quantity * i.price, 0),
  }
})

// Tự động lắng nghe sự kiện đăng nhập / đăng xuất / đổi tài khoản trong authStore
useAuthStore.subscribe((state) => {
  const currentStoreUser = useCartStore.getState().currentUser
  const currentKey = getCartStorageKey(currentStoreUser)
  const nextKey = getCartStorageKey(state.user)

  if (currentKey !== nextKey) {
    useCartStore.getState().switchUser(state.user)
  }
})

/**
 * Hook tương thích ngược cho các component đang sử dụng useCart()
 */
export function useCart() {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const updateQuantity = useCartStore((s) => s.updateQuantity)
  const removeItem = useCartStore((s) => s.removeItem)
  const clear = useCartStore((s) => s.clear)

  // Đếm số loại sản phẩm khác nhau trong giỏ hàng (không cộng dồn số lượng từng món)
  const totalCount = items.length
  const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.price, 0)

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clear,
    totalCount,
    totalQuantity,
    totalPrice,
  }
}
