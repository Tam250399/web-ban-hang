import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import { stockService } from '../../services/stockService'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'
import { formatVnd } from '../../utils/format'

const PAGE_SIZE = 15

/**
 * Component StockImportPanel
 */
export default function StockImportPanel() {
  const navigation = useNavigation()
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const load = useCallback((isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    stockService.getAll()
      .then((data) => {
        setTransactions(data.filter((t) => t.type === 'Import'))
        setVisibleCount(PAGE_SIZE)
      })
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được danh sách phiếu nhập' }))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => { load(false) }, [load])

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => load(false))
    return unsubscribe
  }, [navigation, load])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [debouncedSearch])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return transactions
    return transactions.filter((t) => t.productName?.toLowerCase().includes(q))
  }, [transactions, debouncedSearch])

  const displayedTransactions = filtered.slice(0, visibleCount)
  const hasMore = displayedTransactions.length < filtered.length

  const handleEndReached = () => {
    if (!hasMore) return
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  const handleDelete = (t) => {
    Alert.alert(
      'Xóa giao dịch nhập kho',
      `Bạn có chắc muốn xóa phiếu nhập "${t.productName}"? Tồn kho sản phẩm liên quan sẽ được điều chỉnh lại.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive', onPress: async () => {
            try {
              await stockService.remove(t.id)
              Toast.show({ type: 'success', text1: 'Đã xóa giao dịch nhập kho' })
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
        <Text style={styles.heading}>Lịch sử nhập kho</Text>
        <View style={styles.countBadge}><Text style={styles.countBadgeText}>{filtered.length}</Text></View>
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Tìm theo sản phẩm..."
          placeholderTextColor={admin.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('StockImportForm')}>
          <Text style={styles.addBtnText}>+ Thêm</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={admin.primary} />
      ) : (
        <FlatList
          data={displayedTransactions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.name} numberOfLines={1}>{item.productName}</Text>
                <Text style={styles.total}>{formatVnd(item.quantity * item.unitPrice)}đ</Text>
              </View>
              <Text style={styles.meta}>
                {new Date(item.transactionDate).toLocaleDateString('vi-VN')} · SL {item.quantity} × {formatVnd(item.unitPrice)}đ
              </Text>
              {!!item.note && <Text style={styles.note}>{item.note}</Text>}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('StockImportForm', { transactionId: item.id })}>
                  <Text style={styles.actionText}>Sửa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={() => handleDelete(item)}>
                  <Text style={styles.deleteText}>Xóa</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={admin.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={
            <Text style={styles.empty}>
              {transactions.length === 0 ? 'Chưa có giao dịch nhập kho nào' : 'Không tìm thấy giao dịch phù hợp'}
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
  heading: { fontFamily: fonts.adminDisplayBold, fontSize: 18, color: admin.text },
  countBadge: { backgroundColor: admin.manualBadgeBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: admin.textMuted },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  search: {
    flex: 1, height: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: admin.border,
    borderRadius: 8, fontSize: 14.5, backgroundColor: admin.card, color: admin.text, fontFamily: fonts.adminBody,
  },
  addBtn: { height: 44, paddingHorizontal: 16, backgroundColor: admin.primary, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: admin.white, fontFamily: fonts.adminBodySemiBold, fontSize: 14.5 },
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderRadius: 10, padding: 14 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  name: { flex: 1, fontFamily: fonts.adminBodySemiBold, fontSize: 15.5, color: admin.text },
  total: { fontFamily: fonts.adminDisplayBold, fontSize: 15, color: admin.text },
  meta: { fontFamily: fonts.adminBody, fontSize: 13.5, color: admin.textMuted },
  note: { fontFamily: fonts.adminBody, fontSize: 13.5, color: admin.textMuted, marginTop: 2, fontStyle: 'italic' },
  actions: { flexDirection: 'row', gap: 6, marginTop: 10 },
  actionBtn: {
    flex: 1, paddingVertical: 7, borderWidth: 1, borderColor: admin.border,
    backgroundColor: admin.card, borderRadius: 7, alignItems: 'center',
  },
  actionText: { fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: admin.text },
  deleteBtn: { borderColor: admin.dangerBorder, backgroundColor: admin.dangerBg },
  deleteText: { fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: admin.dangerText },
  empty: { textAlign: 'center', marginTop: 40, color: admin.textMuted, fontFamily: fonts.adminBody, fontSize: 14.5, paddingHorizontal: 20 },
  footerLoader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
})
