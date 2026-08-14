import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { productService } from '../../services/productService'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

function formatVnd(value) {
  return `${Number(value ?? 0).toLocaleString('vi-VN')}đ`
}

const STAT_CARDS = [
  { key: 'totalProducts', icon: '📦', label: 'Tổng sản phẩm', color: '#C1440E', format: (v) => v ?? 0 },
  { key: 'totalStockValue', icon: '💰', label: 'Giá trị tồn kho', color: '#4A5560', format: formatVnd },
  { key: 'totalImported', icon: '📥', label: 'Tổng nhập kho', color: '#22c55e', format: formatVnd },
  { key: 'totalExported', icon: '📤', label: 'Tổng bán ra', color: '#F2B705', format: formatVnd },
  { key: 'lowStockCount', icon: '⚠️', label: 'Sản phẩm sắp hết', color: '#C1440E', format: (v) => v ?? 0 },
]

export default function StatisticsPanel() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = useCallback((isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    productService.getStatistics()
      .then(setStats)
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được số liệu thống kê' }))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => { load(false) }, [load])

  if (loading) {
    return <ActivityIndicator style={styles.loader} color={admin.primary} />
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <Text style={styles.heading}>Thống kê tổng quan</Text>

      <View style={styles.statsGrid}>
        {STAT_CARDS.map((card) => (
          <View key={card.key} style={[styles.statCard, { borderTopColor: card.color }]}>
            <Text style={styles.statIcon}>{card.icon}</Text>
            <Text style={styles.statLabel}>{card.label}</Text>
            <Text style={styles.statValue}>{card.format(stats?.[card.key])}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thống kê theo danh mục</Text>
        {stats?.categoryStats?.length ? (
          stats.categoryStats.map((c) => (
            <View key={c.category} style={styles.row}>
              <Text style={styles.rowTitle} numberOfLines={1}>{c.category}</Text>
              <Text style={styles.rowMeta}>{c.count} SP</Text>
              <Text style={styles.rowValue}>{formatVnd(c.totalValue)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Chưa có dữ liệu</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Giao dịch gần nhất</Text>
        {stats?.recentTransactions?.length ? (
          stats.recentTransactions.map((t) => (
            <View key={t.id} style={styles.row}>
              <View style={styles.rowTitleWrap}>
                <Text style={styles.typeBadge}>{t.type === 'Import' ? '📥' : '📤'}</Text>
                <Text style={styles.rowTitle} numberOfLines={1}>{t.productName}</Text>
              </View>
              <Text style={styles.rowMeta}>SL {t.quantity}</Text>
              <Text style={styles.rowValue}>{formatVnd(t.quantity * t.unitPrice)}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.empty}>Chưa có dữ liệu</Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { marginTop: 40 },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  heading: { fontFamily: fonts.adminDisplayBold, fontSize: 16, color: admin.text },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%', backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border,
    borderTopWidth: 4, borderRadius: 10, padding: 12, gap: 4,
  },
  statIcon: { fontSize: 18 },
  statLabel: { fontFamily: fonts.adminBody, fontSize: 11, color: admin.textMuted },
  statValue: { fontFamily: fonts.adminDisplayBold, fontSize: 15, color: admin.text },
  section: { gap: 8 },
  sectionTitle: { fontFamily: fonts.adminBodySemiBold, fontSize: 13.5, color: admin.text },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderRadius: 10, padding: 11,
  },
  rowTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  rowTitle: { flex: 1, fontFamily: fonts.adminBodySemiBold, fontSize: 12.5, color: admin.text },
  typeBadge: { fontSize: 13 },
  rowMeta: { fontFamily: fonts.adminBody, fontSize: 11.5, color: admin.textMuted },
  rowValue: { fontFamily: fonts.adminDisplayBold, fontSize: 12.5, color: admin.text },
  empty: { textAlign: 'center', color: admin.textMuted, fontFamily: fonts.adminBody, fontSize: 13, paddingVertical: 16 },
})
