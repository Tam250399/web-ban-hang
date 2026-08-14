import { useEffect, useRef } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

export const NAV_ITEMS = [
  { id: 'products', label: 'Sản phẩm', icon: '📋' },
  { id: 'orders', label: 'Đơn hàng', icon: '🛒' },
  { id: 'stock', label: 'Kho', icon: '📦' },
  { id: 'customers', label: 'Khách hàng', icon: '👥' },
  { id: 'stats', label: 'Thống kê', icon: '📊' },
]

export default function AdminNavTabs({ active, onChange }) {
  const scrollRef = useRef(null)
  const itemLayouts = useRef({})

  useEffect(() => {
    const layout = itemLayouts.current[active]
    if (layout && scrollRef.current) {
      scrollRef.current.scrollTo({
        x: Math.max(0, layout.x - 30),
        animated: true,
      })
    }
  }, [active])

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.wrap}
      contentContainerStyle={styles.content}
    >
      {NAV_ITEMS.map((item) => {
        const isActive = item.id === active
        return (
          <TouchableOpacity
            key={item.id}
            style={[styles.pill, isActive && styles.pillActive]}
            onPress={() => onChange(item.id)}
            onLayout={(e) => {
              itemLayouts.current[item.id] = e.nativeEvent.layout
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {item.icon} {item.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  // Chỉ định chiều cao cố định: ScrollView ngang không tự co theo nội dung khi
  // nằm trong flex column, nếu không sẽ giãn hết phần không gian còn lại.
  wrap: { backgroundColor: admin.dark, height: 54, flexGrow: 0, flexShrink: 0 },
  content: { gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  pill: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 9,
    backgroundColor: admin.navBtnBg, alignItems: 'center', justifyContent: 'center',
  },
  pillActive: { backgroundColor: admin.primary },
  pillText: { fontFamily: fonts.adminBodySemiBold, fontSize: 12, color: '#D8D3C7' },
  pillTextActive: { color: '#FFFFFF' },
})
