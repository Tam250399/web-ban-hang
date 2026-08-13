import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import { salesInvoiceService } from '../../services/salesInvoiceService'
import InvoiceCard from './InvoiceCard'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

export default function StockExportPanel() {
  const navigation = useNavigation()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')

  const load = useCallback((isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    salesInvoiceService.getAll()
      .then(setInvoices)
      .catch(() => {})
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => { load(false) }, [load])

  // Reload khi quay lại từ màn tạo/sửa phiếu.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => load(false))
    return unsubscribe
  }, [navigation, load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return invoices
    return invoices.filter((inv) => inv.customerName?.toLowerCase().includes(q))
  }, [invoices, search])

  const handleDelete = (inv) => {
    Alert.alert(
      'Xóa phiếu bán hàng',
      `Bạn có chắc muốn xóa phiếu của "${inv.customerName}"? Tồn kho các sản phẩm liên quan sẽ được hoàn lại.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive', onPress: async () => {
            try {
              await salesInvoiceService.remove(inv.id)
              Toast.show({ type: 'success', text1: 'Đã xóa phiếu bán hàng' })
              load(false)
            } catch (err) {
              Toast.show({ type: 'error', text1: err.message || 'Xóa thất bại' })
            }
          },
        },
      ]
    )
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Lịch sử phiếu bán hàng</Text>
        <View style={styles.countBadge}><Text style={styles.countBadgeText}>{filtered.length}</Text></View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Tìm theo tên khách hàng..."
          placeholderTextColor={admin.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('StockForm')}>
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={admin.primary} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          renderItem={({ item }) => (
            <InvoiceCard
              invoice={{
                customer: item.customerName,
                source: item.fromOrderId ? 'online' : 'manual',
                sourceLabel: item.fromOrderId ? `🛒 Đơn #${item.fromOrderId}` : 'Thủ công',
                date: new Date(item.invoiceDate).toLocaleDateString('vi-VN'),
                items: item.itemCount,
                total: item.total,
              }}
              onEdit={() => navigation.navigate('StockForm', { invoiceId: item.id })}
              onDelete={() => handleDelete(item)}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>
              {invoices.length === 0 ? 'Chưa có phiếu bán hàng nào — bấm "+ Thêm" để tạo phiếu đầu tiên' : 'Không tìm thấy phiếu phù hợp'}
            </Text>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontFamily: fonts.adminDisplayBold, fontSize: 16, color: admin.text },
  countBadge: { backgroundColor: admin.manualBadgeBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontFamily: fonts.adminBodySemiBold, fontSize: 11, color: admin.textMuted },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  search: {
    flex: 1, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderColor: admin.border,
    borderRadius: 8, fontSize: 12.5, backgroundColor: admin.card, color: admin.text, fontFamily: fonts.adminBody,
  },
  addBtn: { paddingHorizontal: 14, paddingVertical: 9, backgroundColor: admin.primary, borderRadius: 8, justifyContent: 'center' },
  addBtnText: { color: admin.white, fontFamily: fonts.adminBodySemiBold, fontSize: 12.5 },
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 10 },
  empty: { textAlign: 'center', marginTop: 40, color: admin.textMuted, fontFamily: fonts.adminBody, fontSize: 13, paddingHorizontal: 20 },
})
