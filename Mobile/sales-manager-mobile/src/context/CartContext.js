import { useEffect, useRef, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { CartContext } from './cart-context'

const STORAGE_KEY = 'salesManagerCart'

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  // AsyncStorage đọc bất đồng bộ nên không thể nạp state khởi tạo ngay như
  // localStorage bên web; cờ này tránh ghi đè STORAGE_KEY bằng mảng rỗng
  // trước khi dữ liệu đã lưu kịp nạp xong.
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

  const addItem = (product, quantity = 1) => {
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
  }

  const updateQuantity = (productId, quantity) => {
    setItems(prev => prev.map(i =>
      i.productId === productId ? { ...i, quantity: Math.max(1, Math.min(quantity, i.maxStock)) } : i
    ))
  }

  const removeItem = (productId) => setItems(prev => prev.filter(i => i.productId !== productId))
  const clear = () => setItems([])

  const totalCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalPrice = items.reduce((sum, i) => sum + i.quantity * i.price, 0)

  return (
    <CartContext.Provider value={{ items, addItem, updateQuantity, removeItem, clear, totalCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}
