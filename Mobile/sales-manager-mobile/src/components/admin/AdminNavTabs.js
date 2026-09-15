import { useEffect, useRef } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'
import { Icon } from '../ui/Icon'

export const NAV_ITEMS = [
  { id: 'products', label: 'Sản phẩm', icon: 'clipboard' },
  { id: 'orders', label: 'Đơn hàng', icon: 'cart' },
  { id: 'stock', label: 'Kho', icon: 'box' },
  { id: 'customers', label: 'Khách hàng', icon: 'users' },
  { id: 'stats', label: 'Thống kê', icon: 'chart' },
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
            <Icon name={item.icon} size={15} color={isActive ? '#FFFFFF' : '#D8D3C7'} />
            <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: admin.dark, height: 54, flexGrow: 0, flexShrink: 0 },
  content: { gap: 8, paddingHorizontal: 12, paddingVertical: 9 },
  pill: {
    paddingHorizontal: 13, paddingVertical: 8, borderRadius: 9,
    backgroundColor: admin.navBtnBg, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 6,
  },
  pillActive: { backgroundColor: admin.primary },
  pillText: { fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: '#D8D3C7' },
  pillTextActive: { color: '#FFFFFF' },
})
