import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { orderService } from '../../services/orderService'
import { useAuth } from '../../context/auth-context'
import { successFeedback } from '../../services/haptics'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'
import { formatVnd } from '../../utils/format'
import { Icon, ICON_ROW } from '../ui/Icon'

const STATUS_LABEL = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã huỷ' }
const STATUS_COLOR = {
  Pending: { bg: admin.manualBadgeBg, text: admin.textMuted },
  Confirmed: { bg: admin.onlineBadgeBg, text: admin.onlineBadgeText },
  Cancelled: { bg: admin.dangerBg, text: admin.dangerText },
}
const FILTERS = [
  { key: '', label: 'Tất cả' },
  { key: 'Pending', label: 'Chờ xác nhận' },
  { key: 'Confirmed', label: 'Đã xác nhận' },
  { key: 'Cancelled', label: 'Đã huỷ' },
]

const PAGE_SIZE = 12

export default function OrdersPanel() {
  const { user } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filter, setFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailOrder, setDetailOrder] = useState(null)
  const [loadingDetailId, setLoadingDetailId] = useState(null)
  const [confirming, setConfirming] = useState(false)

  const load = useCallback((isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    orderService.getAll(filter)
      .then((data) => {
        setOrders(data || [])
        setVisibleCount(PAGE_SIZE)
      })
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được danh sách đơn hàng' }))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [filter])

  useEffect(() => { load(false) }, [load])

  const displayedOrders = orders.slice(0, visibleCount)
  const hasMore = displayedOrders.length < orders.length

  const handleEndReached = () => {
    if (!hasMore) return
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  const openDetail = async (id) => {
    setLoadingDetailId(id)
    try {
      const full = await orderService.getById(id)
      setDetailOrder(full)
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message || 'Không tải được chi tiết đơn hàng.' })
    }
    setLoadingDetailId(null)
  }

  const handleConfirm = async () => {
    if (!detailOrder) return
    setConfirming(true)
    try {
      await orderService.confirm(detailOrder.id, { preparedByName: user?.fullName || user?.username || '' })
      successFeedback()
      Toast.show({ type: 'success', text1: 'Đã xác nhận đơn hàng và tạo phiếu bán hàng!' })
      setDetailOrder(null)
      load(false)
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message || 'Xác nhận thất bại.' })
    } finally {
      setConfirming(false)
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Đơn hàng online</Text>
        <View style={styles.countBadge}><Text style={styles.countBadgeText}>{orders.length}</Text></View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterRowContent}>
        {FILTERS.map((f) => {
          const active = f.key === filter
          return (
            <TouchableOpacity key={f.key} style={[styles.filterChip, active && styles.filterChipActive]} onPress={() => { setFilter(f.key); setLoading(true) }}>
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>

      {loading ? (
        <ActivityIndicator style={styles.loader} color={admin.primary} />
      ) : (
        <FlatList
          data={displayedOrders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshing={refreshing}
          onRefresh={() => load(true)}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          renderItem={({ item }) => {
            const statusColor = STATUS_COLOR[item.status] || STATUS_COLOR.Pending
            return (
              <TouchableOpacity style={styles.card} onPress={() => openDetail(item.id)} disabled={loadingDetailId === item.id}>
                <View style={styles.cardTop}>
                  <Text style={styles.recipient} numberOfLines={1}>{item.recipientName}</Text>
                  <View style={[styles.badge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.badgeText, { color: statusColor.text }]}>
                      {loadingDetailId === item.id ? '...' : STATUS_LABEL[item.status]}
                    </Text>
                  </View>
                </View>
                <Text style={styles.meta}>{item.phoneNumber} · {item.itemCount} sản phẩm</Text>
                <View style={styles.cardBottom}>
                  <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('vi-VN')}</Text>
                  <Text style={styles.total}>{formatVnd(item.total)}đ</Text>
                </View>
              </TouchableOpacity>
            )
          }}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={admin.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>Chưa có đơn hàng nào</Text>}
        />
      )}

      <Modal visible={!!detailOrder} animationType="slide" onRequestClose={() => setDetailOrder(null)}>
        {/* Modal gốc của RN dựng cây view native riêng nên SafeAreaView bên trong
            không tự lấy được inset đúng — phải bọc thêm SafeAreaProvider mới ở đây. */}
        <SafeAreaProvider>
        <SafeAreaView style={styles.detailRoot} edges={['top', 'bottom']}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Đơn hàng #{detailOrder?.id}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setDetailOrder(null)} hitSlop={8} accessibilityLabel="Đóng">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          {detailOrder && (
            <ScrollView contentContainerStyle={styles.detailBody}>
              <Text style={styles.detailLine}><Text style={styles.detailLabel}>Người nhận: </Text>{detailOrder.recipientName} · {detailOrder.phoneNumber}</Text>
              {!!detailOrder.address && <Text style={styles.detailLine}><Text style={styles.detailLabel}>Địa chỉ: </Text>{detailOrder.address}</Text>}
              {!!detailOrder.note && <Text style={styles.detailLine}><Text style={styles.detailLabel}>Ghi chú: </Text>{detailOrder.note}</Text>}
              {!!detailOrder.customerUsername && <Text style={styles.detailLine}><Text style={styles.detailLabel}>Tài khoản: </Text>{detailOrder.customerUsername}</Text>}
              {!!detailOrder.cancelReason && <Text style={styles.detailLine}><Text style={styles.detailLabel}>Lý do huỷ: </Text>{detailOrder.cancelReason}</Text>}

              <View style={styles.itemsList}>
                {detailOrder.items?.map((it, i) => (
                  <View key={i} style={styles.itemRow}>
                    <Text style={styles.itemName} numberOfLines={2}>{it.productName}</Text>
                    <Text style={styles.itemMeta}>{it.quantity} × {formatVnd(it.unitPrice)}đ</Text>
                    <Text style={styles.itemTotal}>{formatVnd(it.quantity * it.unitPrice)}đ</Text>
                  </View>
                ))}
              </View>

              <View style={styles.detailTotalRow}>
                <Text style={styles.detailTotalLabel}>Tổng cộng</Text>
                <Text style={styles.detailTotalValue}>{formatVnd(detailOrder.total)}đ</Text>
              </View>

              {detailOrder.status === 'Pending' && (
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={confirming}>
                  <View style={ICON_ROW}>
                    {!confirming && <Icon name="check" size={16} color={admin.white} />}
                    <Text style={styles.confirmBtnText}>{confirming ? 'Đang xác nhận...' : 'Xác nhận đơn hàng'}</Text>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontFamily: fonts.adminDisplayBold, fontSize: 17, color: admin.text },
  countBadge: { backgroundColor: admin.manualBadgeBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontFamily: fonts.adminBodySemiBold, fontSize: 12.5, color: admin.textMuted },
  filterRow: { marginTop: 10, flexGrow: 0, flexShrink: 0 },
  filterRowContent: { gap: 8, paddingHorizontal: 16, paddingVertical: 2 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
    backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border,
    alignItems: 'center', justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: admin.primary, borderColor: admin.primary },
  filterChipText: { fontFamily: fonts.adminBodySemiBold, fontSize: 13.5, lineHeight: 20, color: admin.textMuted, textAlign: 'center', includeFontPadding: false },
  filterChipTextActive: { color: admin.white },
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderRadius: 10, padding: 13 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  recipient: { flex: 1, fontFamily: fonts.adminBodySemiBold, fontSize: 14.5, color: admin.text },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  badgeText: { fontFamily: fonts.adminBodySemiBold, fontSize: 12 },
  meta: { fontFamily: fonts.adminBody, fontSize: 13, color: admin.textMuted, marginBottom: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { fontFamily: fonts.adminBody, fontSize: 13, color: admin.textMuted },
  total: { fontFamily: fonts.adminDisplayBold, fontSize: 14, color: admin.text },
  empty: { textAlign: 'center', marginTop: 40, color: admin.textMuted, fontFamily: fonts.adminBody, fontSize: 14 },
  footerLoader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },

  detailRoot: { flex: 1, backgroundColor: admin.bg },
  detailHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: admin.divider,
  },
  detailTitle: { fontFamily: fonts.adminDisplayBold, fontSize: 17, color: admin.text },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
  detailBody: { padding: 16, gap: 6 },
  detailLine: { fontFamily: fonts.adminBody, fontSize: 14, color: admin.text, lineHeight: 20 },
  detailLabel: { fontFamily: fonts.adminBodySemiBold },
  itemsList: { marginTop: 12, gap: 8 },
  itemRow: { backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderRadius: 10, padding: 11 },
  itemName: { fontFamily: fonts.adminBodySemiBold, fontSize: 13.5, color: admin.text, marginBottom: 6 },
  itemMeta: { fontFamily: fonts.adminBody, fontSize: 13, color: admin.textMuted },
  itemTotal: { fontFamily: fonts.adminDisplayBold, fontSize: 14, color: admin.text, marginTop: 4, textAlign: 'right' },
  detailTotalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    borderTopWidth: 1, borderTopColor: admin.border, borderStyle: 'dashed', paddingTop: 12, marginTop: 8,
  },
  detailTotalLabel: { fontFamily: fonts.adminBody, fontSize: 13.5, color: admin.textMuted },
  detailTotalValue: { fontFamily: fonts.adminDisplayBold, fontSize: 19, color: admin.text },
  confirmBtn: { marginTop: 16, paddingVertical: 13, backgroundColor: admin.primary, borderRadius: 10, alignItems: 'center' },
  confirmBtnText: { color: admin.white, fontFamily: fonts.adminBodyBold, fontSize: 15 },
})
