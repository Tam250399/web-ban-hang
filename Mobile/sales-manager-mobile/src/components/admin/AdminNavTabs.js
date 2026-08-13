import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

const NAV_ITEMS = [
  { id: 'products', label: 'Sản phẩm', icon: '📋' },
  { id: 'orders', label: 'Đơn hàng', icon: '🛒' },
  { id: 'stock', label: 'Kho', icon: '📦' },
  { id: 'customers', label: 'Khách hàng', icon: '👥' },
  { id: 'stats', label: 'Thống kê', icon: '📊' },
]

export default function AdminNavTabs({ active, onChange }) {
  return (
    <ScrollView
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
            style={styles.pill}
            onPress={() => onChange(item.id)}
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
  content: { gap: 6, paddingHorizontal: 12, paddingVertical: 10 },
  pill: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, backgroundColor: admin.navBtnBg },
  pillText: { fontFamily: fonts.adminBodySemiBold, fontSize: 11.5, color: '#D8D3C7' },
  pillTextActive: { color: admin.primary },
})
