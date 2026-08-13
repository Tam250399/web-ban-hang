import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

function formatVnd(value) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

export default function InvoiceCard({ invoice, onEdit, onDelete }) {
  const isOnline = invoice.source === 'online'
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.customer} numberOfLines={1}>{invoice.customer}</Text>
        <View style={[styles.badge, isOnline ? styles.badgeOnline : styles.badgeManual]}>
          <Text style={[styles.badgeText, isOnline ? styles.badgeTextOnline : styles.badgeTextManual]}>
            {invoice.sourceLabel}
          </Text>
        </View>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.meta}>{invoice.date} · {invoice.items} sản phẩm</Text>
        <Text style={styles.total}>{formatVnd(invoice.total)}đ</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={onEdit}>
          <Text style={styles.actionText}>Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={onDelete}>
          <Text style={styles.deleteText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderRadius: 10, padding: 14 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  customer: { flex: 1, fontFamily: fonts.adminBodySemiBold, fontSize: 14.5, color: admin.text },
  badge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8 },
  badgeOnline: { backgroundColor: admin.onlineBadgeBg },
  badgeManual: { backgroundColor: admin.manualBadgeBg },
  badgeText: { fontFamily: fonts.adminBodySemiBold, fontSize: 11 },
  badgeTextOnline: { color: admin.onlineBadgeText },
  badgeTextManual: { color: admin.textMuted },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  meta: { fontFamily: fonts.adminBody, fontSize: 12.5, color: admin.textMuted },
  total: { fontFamily: fonts.adminDisplayBold, fontSize: 14, color: admin.text },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    flex: 1, paddingVertical: 7, borderWidth: 1, borderColor: admin.border,
    backgroundColor: admin.card, borderRadius: 7, alignItems: 'center',
  },
  actionText: { fontFamily: fonts.adminBodySemiBold, fontSize: 12, color: admin.text },
  deleteBtn: { borderColor: admin.dangerBorder, backgroundColor: admin.dangerBg },
  deleteText: { fontFamily: fonts.adminBodySemiBold, fontSize: 12, color: admin.dangerText },
})
