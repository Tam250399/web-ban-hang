import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator, Alert, SectionList, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import { salesInvoiceService } from '../../services/salesInvoiceService'
import InvoiceCard from './InvoiceCard'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { fonts } from '../../theme/fonts'
import { formatVnd, formatDDMMYYYY, startOfDay, WEEKDAYS } from '../../utils/format'

const PAGE_SIZE = 10

// Bảng màu tương phản cao, đồng bộ với màn tạo phiếu bán hàng.
const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#CBD5E1',
  borderSoft: '#E2E8F0',
  text: '#0F172A',
  textSoft: '#475569',
  textMuted: '#64748B',
  primary: '#1D4ED8',
  primarySoft: '#EFF6FF',
  money: '#B45309',
}

const RANGES = [
  { key: 'all', label: 'Tất cả' },
  { key: 'today', label: 'Hôm nay' },
  { key: 'week', label: '7 ngày qua' },
]

// Nhãn ngày thân thiện dùng cho tiêu đề nhóm: "HÔM NAY", "HÔM QUA", "THỨ BA, 12-08-2026".
function sectionTitle(date) {
  const d = startOfDay(date)
  const today = startOfDay(new Date())
  const diffDays = Math.round((today - d) / 86400000)
  if (diffDays === 0) return 'HÔM NAY'
  if (diffDays === 1) return 'HÔM QUA'
  return `${WEEKDAYS[d.getDay()]}, ${formatDDMMYYYY(d)}`.toUpperCase()
}

export default function StockExportPanel() {
  const navigation = useNavigation()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [range, setRange] = useState('all')
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const load = useCallback((isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    salesInvoiceService.getAll()
      .then((data) => {
        setInvoices(data || [])
        setVisibleCount(PAGE_SIZE)
      })
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được danh sách phiếu bán hàng' }))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => { load(false) }, [load])

  // Reload khi quay lại từ màn tạo/sửa phiếu.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => load(false))
    return unsubscribe
  }, [navigation, load])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [debouncedSearch, range])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    const today = startOfDay(new Date())
    const weekAgo = new Date(today)
    weekAgo.setDate(today.getDate() - 6)

    return invoices.filter((inv) => {
      if (q && !inv.customerName?.toLowerCase().includes(q)) return false
      if (range === 'all') return true
      const d = startOfDay(inv.invoiceDate)
      if (range === 'today') return d.getTime() === today.getTime()
      return d >= weekAgo
    })
  }, [invoices, debouncedSearch, range])

  const totalAmount = useMemo(
    () => filtered.reduce((sum, inv) => sum + Number(inv.total || 0), 0),
    [filtered]
  )

  const displayed = filtered.slice(0, visibleCount)
  const hasMore = displayed.length < filtered.length

  // Gom phiếu theo ngày để dễ dò tìm (tiêu đề nhóm dính khi cuộn).
  const sections = useMemo(() => {
    const groups = []
    displayed.forEach((inv) => {
      const key = startOfDay(inv.invoiceDate).getTime()
      const last = groups[groups.length - 1]
      if (last && last.key === key) last.data.push(inv)
      else groups.push({ key, title: sectionTitle(inv.invoiceDate), data: [inv] })
    })
    return groups
  }, [displayed])

  const handleEndReached = () => {
    if (!hasMore) return
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  const handleDelete = useCallback((inv) => {
    Alert.alert(
      'Xóa phiếu bán hàng?',
      `Phiếu của khách "${inv.customerName}" (${formatVnd(inv.total)}đ) sẽ bị xóa.\n\nSố hàng đã xuất sẽ được cộng trả lại vào kho.`,
      [
        { text: 'Không xóa', style: 'cancel' },
        {
          text: 'Xóa phiếu', style: 'destructive', onPress: async () => {
            try {
              await salesInvoiceService.remove(inv.id)
              Toast.show({ type: 'success', text1: 'Đã xóa phiếu bán hàng' })
              load(false)
            } catch (err) {
              Toast.show({ type: 'error', text1: err.message || 'Xóa không thành công' })
            }
          },
        },
      ]
    )
  }, [load])

  const handleEdit = useCallback(
    (inv) => navigation.navigate('StockForm', { invoiceId: inv.id }),
    [navigation]
  )

  // InvoiceCard đã memo — cả renderItem lẫn hai callback truyền xuống đều phải
  // giữ nguyên tham chiếu. Nếu bọc arrow function theo từng item ở đây thì props
  // đổi mỗi lần render và memo không bao giờ khớp; vì vậy InvoiceCard tự truyền
  // lại `invoice` khi gọi onEdit/onDelete.
  const renderInvoice = useCallback(
    ({ item }) => <InvoiceCard invoice={item} onEdit={handleEdit} onDelete={handleDelete} />,
    [handleEdit, handleDelete]
  )

  const listHeader = (
    <View style={styles.listHeader}>
      {/* ── Ô tìm kiếm ── */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm theo tên khách hàng..."
          placeholderTextColor="#94A3B8"
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {!!search && (
          <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch('')} activeOpacity={0.7}>
            <Text style={styles.clearBtnText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Lọc nhanh theo thời gian ── */}
      <View style={styles.rangeRow}>
        {RANGES.map((item) => {
          const active = range === item.key
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.rangeChip, active && styles.rangeChipOn]}
              onPress={() => setRange(item.key)}
              activeOpacity={0.7}
            >
              <Text style={[styles.rangeChipText, active && styles.rangeChipTextOn]}>{item.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* ── Tổng kết nhanh ── */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Số phiếu</Text>
          <Text style={styles.summaryValue}>{filtered.length}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>Tổng tiền</Text>
          <Text style={[styles.summaryValue, styles.summaryMoney]}>{formatVnd(totalAmount)}đ</Text>
        </View>
      </View>
    </View>
  )

  return (
    <View style={styles.root}>
      {/* ══ Tiêu đề + nút tạo phiếu (luôn hiện) ══ */}
      <View style={styles.header}>
        <Text style={styles.heading}>Phiếu bán hàng</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('StockForm')}
          activeOpacity={0.85}
          accessibilityLabel="Tạo phiếu bán hàng mới"
        >
          <Text style={styles.addBtnIcon}>＋</Text>
          <Text style={styles.addBtnText}>TẠO PHIẾU BÁN HÀNG</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderWrap}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={styles.loaderText}>Đang tải danh sách phiếu...</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          ListHeaderComponent={listHeader}
          stickySectionHeadersEnabled
          refreshing={refreshing}
          onRefresh={() => load(true)}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.3}
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={5}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
              <Text style={styles.sectionHeaderCount}>{section.data.length} phiếu</Text>
            </View>
          )}
          renderItem={renderInvoice}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={C.primary} />
                <Text style={styles.footerLoaderText}>Đang tải thêm phiếu...</Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyIcon}>{invoices.length === 0 ? '🧾' : '🔎'}</Text>
              <Text style={styles.emptyTitle}>
                {invoices.length === 0 ? 'Chưa có phiếu bán hàng nào' : 'Không tìm thấy phiếu nào'}
              </Text>
              <Text style={styles.emptyHint}>
                {invoices.length === 0
                  ? 'Bấm nút xanh “TẠO PHIẾU BÁN HÀNG” ở phía trên để tạo phiếu đầu tiên.'
                  : 'Hãy thử xóa bớt chữ trong ô tìm kiếm, hoặc chọn lại mục “Tất cả”.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  // ── Tiêu đề cố định ──
  header: {
    paddingHorizontal: 14, paddingTop: 12, paddingBottom: 12, gap: 10,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.borderSoft,
  },
  heading: { fontFamily: fonts.adminDisplayBold, fontSize: 19, color: C.text },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    height: 48, backgroundColor: C.primary, borderRadius: 12,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.28, shadowRadius: 6, elevation: 3,
  },
  addBtnIcon: { color: '#FFFFFF', fontFamily: fonts.adminBodyBold, fontSize: 19, lineHeight: 22 },
  addBtnText: { color: '#FFFFFF', fontFamily: fonts.adminBodyBold, fontSize: 14.5, letterSpacing: 0.3 },

  // ── Phần đầu danh sách (cuộn theo) ──
  listHeader: { gap: 10, paddingBottom: 4 },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 46, paddingHorizontal: 12,
    borderWidth: 2, borderColor: C.border, borderRadius: 12, backgroundColor: C.card,
  },
  searchIcon: { fontSize: 15 },
  searchInput: {
    flex: 1, fontSize: 14, color: C.text, fontFamily: fonts.adminBodyMedium, paddingVertical: 0,
  },
  clearBtn: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  clearBtnText: { fontSize: 12, color: C.textSoft, fontFamily: fonts.adminBodyBold },

  rangeRow: { flexDirection: 'row', gap: 7 },
  rangeChip: {
    flex: 1, height: 42, borderRadius: 11, borderWidth: 2, borderColor: C.border,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
  },
  rangeChipOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
  rangeChipText: { fontFamily: fonts.adminBodyBold, fontSize: 13, color: C.textSoft },
  rangeChipTextOn: { color: C.primary },

  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, borderRadius: 12, borderWidth: 2, borderColor: C.borderSoft,
    paddingVertical: 11, paddingHorizontal: 7,
  },
  summaryCol: { flex: 1, alignItems: 'center', gap: 3 },
  summaryDivider: { width: 1, height: 32, backgroundColor: C.borderSoft },
  summaryLabel: { fontFamily: fonts.adminBodyMedium, fontSize: 12.5, color: C.textMuted },
  summaryValue: { fontFamily: fonts.adminDisplayBold, fontSize: 20, color: C.text },
  summaryMoney: { color: C.money, fontSize: 18 },

  // ── Danh sách ──
  list: { padding: 14, paddingBottom: 28, gap: 10 },
  sectionHeaderWrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.bg, paddingVertical: 8, marginTop: 3,
  },
  sectionHeaderText: { fontFamily: fonts.adminBodyBold, fontSize: 13, color: C.textSoft, letterSpacing: 0.5 },
  sectionHeaderCount: { fontFamily: fonts.adminBodyMedium, fontSize: 12.5, color: C.textMuted },

  loaderWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loaderText: { fontFamily: fonts.adminBodyMedium, fontSize: 14, color: C.textSoft },
  footerLoader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 15, gap: 7 },
  footerLoaderText: { fontFamily: fonts.adminBodyMedium, fontSize: 12.5, color: C.textMuted },

  emptyWrap: { alignItems: 'center', gap: 8, paddingTop: 34, paddingHorizontal: 18 },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontFamily: fonts.adminBodyBold, fontSize: 17, color: C.text, textAlign: 'center' },
  emptyHint: {
    fontFamily: fonts.adminBody, fontSize: 13.5, color: C.textMuted,
    textAlign: 'center', lineHeight: 20,
  },
})
