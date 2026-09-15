import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CartContext } from './cart-context'

const STORAGE_KEY = 'salesManagerCart'

/**
 * Provider quản lý trạng thái và dữ liệu giỏ hàng người dùng
 */
export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const hasLoaded = useRef(false)

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => { if (raw) setItems(JSON.parse(raw)) })
      .catch(() => {})
      .finally(() => { hasLoaded.current = true })
  }, [])

  useEffect(() => {
    if (!hasLoaded.current) return
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items)).catch(() => {})
  }, [items])

  const addItem = useCallback((product, quantity = 1) => {
    const maxStock = product.stockQuantity ?? Infinity
    setItems(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, maxStock)
        return prev.map(i => i.productId === product.id ? { ...i, quantity: nextQty } : i)
      }
      return [...prev, {
        productId: product.id,
        productName: product.productName,
        productCode: product.productCode,
        unit: product.unitTypeName || product.unit,
        price: product.price,
        imageUrl: product.imageUrl,
        maxStock,
        quantity: Math.max(1, Math.min(quantity, maxStock)),
      }]
    })
  }, [])

  const updateQuantity = useCallback((productId, quantity) => {
    setItems(prev => prev.map(i =>
      i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) } : i
    ))
  }, [])

  const removeItem = useCallback((productId) => setItems(prev => prev.filter(i => i.productId !== productId)), [])
  const clear = useCallback(() => setItems([]), [])

  const { totalCount, totalPrice } = useMemo(() => ({
    totalCount: items.reduce((sum, i) => sum + i.quantity, 0),
    totalPrice: items.reduce((sum, i) => sum + i.quantity * i.price, 0),
  }), [items])

  const value = useMemo(
    () => ({ items, addItem, updateQuantity, removeItem, clear, totalCount, totalPrice }),
    [items, addItem, updateQuantity, removeItem, clear, totalCount, totalPrice]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
