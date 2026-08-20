import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { fonts } from '../../theme/fonts'

// Bảng màu tương phản cao, đồng bộ với màn tạo phiếu bán hàng.
const C = {
  card: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSoft: '#475569',
  textMuted: '#64748B',
  primary: '#1D4ED8',
  primarySoft: '#EFF6FF',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  money: '#B45309',
  onlineBg: '#DBEAFE',
  onlineText: '#1E40AF',
  manualBg: '#F1F5F9',
}

function formatVnd(value) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

// Thẻ phiếu bán hàng cỡ lớn: tên khách 20px, tổng tiền 26px,
// hai nút thao tác cao 56px kèm nhãn chữ rõ ràng.
export default function InvoiceCard({ invoice, onEdit, onDelete }) {
  const isOnline = invoice.source === 'online'
  return (
    <View style={styles.card}>
      {/* ── Tên khách hàng ── */}
      <View style={styles.topRow}>
        <Text style={styles.customerIcon}>👤</Text>
        <Text style={styles.customer} numberOfLines={2}>{invoice.customer}</Text>
      </View>

      <View style={[styles.badge, isOnline ? styles.badgeOnline : styles.badgeManual]}>
        <Text style={[styles.badgeText, isOnline ? styles.badgeTextOnline : styles.badgeTextManual]}>
          {invoice.sourceLabel}
        </Text>
      </View>

      {/* ── Thông tin phiếu ── */}
      <View style={styles.infoBlock}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Ngày bán</Text>
          <Text style={styles.infoValue}>{invoice.date}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số mặt hàng</Text>
          <Text style={styles.infoValue}>{invoice.items} mặt hàng</Text>
        </View>
      </View>

      {/* ── Tổng tiền ── */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Tổng tiền</Text>
        <Text style={styles.totalValue}>{formatVnd(invoice.total)}đ</Text>
      </View>

      {/* ── Thao tác ── */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={onEdit}
          activeOpacity={0.75}
          accessibilityLabel={`Sửa phiếu của ${invoice.customer}`}
        >
          <Text style={styles.editText}>✏️  Xem / Sửa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={onDelete}
          activeOpacity={0.75}
          accessibilityLabel={`Xóa phiếu của ${invoice.customer}`}
        >
          <Text style={styles.deleteText}>🗑  Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderWidth: 2,
    borderColor: C.border,
    borderRadius: 14,
    padding: 13,
    gap: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  customerIcon: { fontSize: 19, lineHeight: 24 },
  customer: { flex: 1, fontFamily: fonts.adminBodyBold, fontSize: 16.5, color: C.text, lineHeight: 22 },

  badge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 9 },
  badgeOnline: { backgroundColor: C.onlineBg },
  badgeManual: { backgroundColor: C.manualBg },
  badgeText: { fontFamily: fonts.adminBodyBold, fontSize: 12.5 },
  badgeTextOnline: { color: C.onlineText },
  badgeTextManual: { color: C.textSoft },

  infoBlock: {
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
    marginTop: 2,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 },
  infoLabel: { fontFamily: fonts.adminBodyMedium, fontSize: 13.5, color: C.textMuted },
  infoValue: { fontFamily: fonts.adminBodyBold, fontSize: 14.5, color: C.text },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 10,
  },
  totalLabel: { fontFamily: fonts.adminBodyBold, fontSize: 14, color: C.textSoft },
  totalValue: { fontFamily: fonts.adminDisplayBold, fontSize: 21, color: C.money },

  actions: { flexDirection: 'row', gap: 8, marginTop: 3 },
  editBtn: {
    flex: 2, height: 46, borderRadius: 11, borderWidth: 2, borderColor: '#BFDBFE',
    backgroundColor: C.primarySoft, alignItems: 'center', justifyContent: 'center',
  },
  editText: { fontFamily: fonts.adminBodyBold, fontSize: 14, color: C.primary },
  deleteBtn: {
    flex: 1, height: 46, borderRadius: 11, borderWidth: 2, borderColor: '#FCA5A5',
    backgroundColor: C.dangerSoft, alignItems: 'center', justifyContent: 'center',
  },
  deleteText: { fontFamily: fonts.adminBodyBold, fontSize: 14, color: C.danger },
})
