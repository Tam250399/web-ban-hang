import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import { orderService } from '../services/orderService'
import { useAuth } from '../context/auth-context'
import { useCachedResource } from '../hooks/useCachedResource'
import { useRequireOnline } from '../hooks/useRequireOnline'
import { CACHE_KEYS, formatCacheAge } from '../services/cache'
import { OrderCardSkeleton } from '../components/ui/Skeleton'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'
import { formatVnd, formatDay } from '../utils/format'

const STATUS_LABEL = { Pending: 'Chờ xác nhận', Confirmed: 'Đã xác nhận', Cancelled: 'Đã huỷ' }
const STATUS_COLOR = {
  Pending: { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  Confirmed: { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
  Cancelled: { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
}

const FILTERS = [
  { key: '', label: 'Tất cả' },
  { key: 'Pending', label: 'Chờ xác nhận' },
  { key: 'Confirmed', label: 'Đã xác nhận' },
  { key: 'Cancelled', label: 'Đã huỷ' },
]

const PAGE_SIZE = 8

export default function MyOrdersScreen() {
  const { isGuest } = useAuth()
  const navigation = useNavigation()
  const requireOnline = useRequireOnline()
  const [filter, setFilter] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [cancellingId, setCancellingId] = useState(null)
  const [reorderingId, setReorderingId] = useState(null)

  // Cache-then-network: đơn hàng đã xem vẫn tra cứu được khi ra công trình mất
  // sóng, thay vì màn hình trắng như trước.
  const {
    data,
    loading,
    refreshing,
    isStale,
    cachedAt,
    isOnline,
    refresh,
    reload,
  } = useCachedResource(CACHE_KEYS.myOrders, () => orderService.getMine(), { enabled: !isGuest })

  const orders = data ?? []

  useEffect(() => {
    if (isGuest) return
    const unsubscribe = navigation.addListener('focus', reload)
    return unsubscribe
  }, [navigation, reload, isGuest])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [filter])

  const filteredOrders = orders.filter((o) => !filter || o.status === filter)
  const displayedOrders = filteredOrders.slice(0, visibleCount)
  const hasMore = displayedOrders.length < filteredOrders.length

  // Dữ liệu đã nằm sẵn trong state, chỉ cắt thêm một lát mảng — không có gì để
  // "chờ". setTimeout 200ms trước đây chỉ là độ trễ nhân tạo khi cuộn tới cuối.
  const handleEndReached = () => {
    if (!hasMore) return
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  const handleCancel = (id) => {
    if (!requireOnline('Hủy đơn hàng')) return
    Alert.alert(
      'Hủy đơn hàng',
      'Bạn có chắc muốn hủy đơn hàng này không?',
      [
        { text: 'Bỏ qua', style: 'cancel' },
        {
          text: 'Xác nhận hủy',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(id)
            try {
              await orderService.cancel(id, {})
              Toast.show({ type: 'success', text1: 'Đã hủy đơn hàng' })
              reload()
            } catch (err) {
              Toast.show({ type: 'error', text1: err.message || 'Hủy đơn thất bại' })
            } finally {
              setCancellingId(null)
            }
          },
        },
      ]
    )
  }

  const handleReorder = async (id) => {
    if (!requireOnline('Đặt lại đơn hàng')) return
    setReorderingId(id)
    try {
      const res = await orderService.reorder(id)
      Toast.show({ type: 'success', text1: res?.message || 'Đã đặt lại đơn hàng' })
      reload()
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message || 'Không đặt lại được đơn hàng' })
    } finally {
      setReorderingId(null)
    }
  }

  // ── Guest view ──
  if (isGuest) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
          <Text style={styles.headerSub}>Cửa Hàng VLXD Lý Sáu</Text>
        </View>
        <View style={styles.guestWrap}>
          <Text style={styles.guestIcon}>📦</Text>
          <Text style={styles.guestTitle}>Đăng nhập để xem đơn hàng</Text>
          <Text style={styles.guestSub}>
            Vui lòng đăng nhập tài khoản khách hàng để theo dõi trạng thái và lịch sử mua hàng của bạn.
          </Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.8}>
            <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <Text style={styles.headerSub}>Cửa Hàng VLXD Lý Sáu • {orders.length} đơn hàng</Text>
      </View>

      {/* ── Filter row ── */}
      <View style={styles.filterBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterRowContent}
        >
          {FILTERS.map((f) => {
            const active = f.key === filter
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.7}
              >
                <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>
      </View>

      {/* ── Đang xem bản lưu trên máy ── */}
      {isStale && !loading && (
        <View style={styles.staleBar}>
          <Text style={styles.staleText}>
            {isOnline
              ? `Chưa cập nhật được — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`
              : `Đang ngoại tuyến — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`}
          </Text>
        </View>
      )}

      {/* ── Content ── */}
      {loading ? (
        <View style={styles.listContent}>
          {Array.from({ length: 4 }).map((_, i) => <OrderCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={displayedOrders}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          ListEmptyComponent={
            !isOnline && orders.length === 0 ? (
              <View style={styles.offlineEmpty}>
                <Text style={styles.offlineEmptyTitle}>Chưa có dữ liệu ngoại tuyến</Text>
                <Text style={styles.offlineEmptyText}>
                  Kết nối mạng một lần để tải đơn hàng về máy, sau đó vẫn tra cứu được khi mất sóng.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => {
            const statusStyle = STATUS_COLOR[item.status] || STATUS_COLOR.Pending
            const isCancelling = cancellingId === item.id
            const isReordering = reorderingId === item.id

            return (
              <View style={styles.orderCard}>
                {/* ── Card top ── */}
                <View style={styles.cardHeader}>
                  <Text style={styles.orderId}>Đơn #{item.id} • {formatDay(item.createdAt)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg, borderColor: statusStyle.border }]}>
                    <Text style={[styles.statusText, { color: statusStyle.text }]}>
                      {STATUS_LABEL[item.status]}
                    </Text>
                  </View>
                </View>

                {/* ── Delivery info ── */}
                <View style={styles.deliverySection}>
                  <Text style={styles.recipientName}>
                    👤 {item.recipientName} • {item.phoneNumber}
                  </Text>
                  {!!item.address && (
                    <Text style={styles.addressText} numberOfLines={2}>
                      📍 {item.address}
                    </Text>
                  )}
                </View>

                {/* ── Order items ── */}
                <View style={styles.itemsList}>
                  {item.items?.map((it, idx) => (
                    <View key={idx} style={styles.itemRow}>
                      <Text style={styles.itemProductName} numberOfLines={1}>
                        {it.productName} <Text style={styles.itemQty}>× {it.quantity}</Text>
                      </Text>
                      <Text style={styles.itemPrice}>{formatVnd(it.quantity * it.unitPrice)}đ</Text>
                    </View>
                  ))}
                </View>

                {/* ── Total row ── */}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tổng cộng</Text>
                  <Text style={styles.totalValue}>{formatVnd(item.total)}đ</Text>
                </View>

                {/* ── Cancel reason ── */}
                {item.status === 'Cancelled' && !!item.cancelReason && (
                  <Text style={styles.cancelReason}>Lý do hủy: {item.cancelReason}</Text>
                )}

                {/* ── Action buttons ── */}
                {item.status === 'Pending' && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => handleCancel(item.id)}
                      disabled={isCancelling}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.cancelBtnText}>
                        {isCancelling ? 'Đang hủy...' : 'Hủy đơn hàng'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {item.status === 'Cancelled' && (
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.reorderBtn}
                      onPress={() => handleReorder(item.id)}
                      disabled={isReordering}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.reorderBtnText}>
                        {isReordering ? 'Đang xử lý...' : '🔁 Đặt lại đơn'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )
          }}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={brand.primary} />
                <Text style={styles.footerLoaderText}>Đang tải thêm đơn hàng...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyTitle}>Chưa có đơn hàng</Text>
              <Text style={styles.emptyText}>
                {filter
                  ? 'Không tìm thấy đơn hàng nào ở trạng thái này.'
                  : 'Bạn chưa có đơn hàng nào. Hãy chọn sản phẩm và đặt hàng ngay nhé!'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerTitle: { fontFamily: fonts.displayExtraBold, fontSize: 19, color: '#0F172A' },
  headerSub: { fontFamily: fonts.bodyBold, fontSize: 13, color: brand.primary, marginTop: 2 },

  // ── Guest view ──
  guestWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  guestIcon: { fontSize: 54, marginBottom: 14 },
  guestTitle: { fontFamily: fonts.displayBold, fontSize: 22, color: brand.text, marginBottom: 8 },
  guestSub: { fontFamily: fonts.body, fontSize: 15, color: brand.textMuted, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  loginBtn: { backgroundColor: brand.primary, paddingHorizontal: 28, paddingVertical: 13, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontFamily: fonts.displayBold, fontSize: 16 },

  // ── Filter row ──
  filterBarWrap: {
    backgroundColor: brand.white,
    borderBottomWidth: 1,
    borderBottomColor: brand.cardBorder,
  },
  filterRow: { flexGrow: 0, flexShrink: 0 },
  filterRowContent: { gap: 8, paddingHorizontal: 16, paddingVertical: 10 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: brand.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipActive: { backgroundColor: brand.primary, borderColor: brand.primary },
  filterChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    lineHeight: 20,
    color: brand.ink,
    textAlign: 'center',
    includeFontPadding: false,
  },
  filterChipTextActive: { color: '#FFFFFF' },

  staleBar: {
    backgroundColor: '#FEF3C7', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#FDE68A',
    paddingVertical: 7, paddingHorizontal: 14,
  },
  staleText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: '#92400E', textAlign: 'center' },
  offlineEmpty: { paddingHorizontal: 20, paddingTop: 32, gap: 8 },
  offlineEmptyTitle: { fontFamily: fonts.displayBold, fontSize: 18, color: brand.ink, textAlign: 'center' },
  offlineEmptyText: { fontFamily: fonts.body, fontSize: 14.5, color: brand.textMuted, textAlign: 'center', lineHeight: 20 },
  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loaderText: { fontFamily: fonts.bodyBold, fontSize: 15, color: brand.textMuted, marginTop: 10 },

  listContent: { padding: 16, gap: 14 },
  orderCard: {
    backgroundColor: brand.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: brand.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  orderId: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: brand.ink },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  statusText: { fontFamily: fonts.bodyBold, fontSize: 13, lineHeight: 19, textAlign: 'center', includeFontPadding: false },

  deliverySection: { backgroundColor: brand.bg, borderRadius: 10, padding: 12, marginBottom: 12 },
  recipientName: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: brand.ink },
  addressText: { fontFamily: fonts.body, fontSize: 13.5, color: brand.text, marginTop: 4 },

  itemsList: { borderTopWidth: 1, borderTopColor: brand.cardBorder, paddingTop: 10, gap: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemProductName: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14.5, color: brand.ink, marginRight: 8 },
  itemQty: { fontFamily: fonts.bodyBold, fontSize: 14.5, color: brand.primary },
  itemPrice: { fontFamily: fonts.monoBold, fontSize: 14.5, color: brand.ink },

  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    borderTopWidth: 1, borderTopColor: brand.cardBorder, borderStyle: 'dashed',
    paddingTop: 12, marginTop: 12,
  },
  totalLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: brand.ink },
  totalValue: { fontFamily: fonts.monoBold, fontSize: 18.5, color: brand.primary },

  cancelReason: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: '#dc2626', marginTop: 10, fontStyle: 'italic' },
  cardActions: { marginTop: 14 },
  cancelBtn: {
    paddingVertical: 11, paddingHorizontal: 16, borderWidth: 1, borderColor: '#fecaca', backgroundColor: '#fef2f2',
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: fonts.bodyBold, fontSize: 14.5, lineHeight: 21, color: '#dc2626', textAlign: 'center', includeFontPadding: false },
  reorderBtn: {
    paddingVertical: 11, paddingHorizontal: 16, borderWidth: 1, borderColor: brand.cardBorder, backgroundColor: brand.card,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  reorderBtnText: { fontFamily: fonts.bodyBold, fontSize: 14.5, lineHeight: 21, color: brand.ink, textAlign: 'center', includeFontPadding: false },

  emptyWrap: { alignItems: 'center', marginTop: 60, paddingHorizontal: 40 },
  emptyIcon: { fontSize: 44, marginBottom: 10 },
  emptyTitle: { fontFamily: fonts.displayBold, fontSize: 19, color: brand.ink, marginBottom: 6 },
  emptyText: { fontFamily: fonts.body, fontSize: 14.5, color: brand.textMuted, textAlign: 'center', lineHeight: 20 },

  footerLoader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  footerLoaderText: { fontFamily: fonts.body, fontSize: 13.5, color: brand.textMuted },
})
