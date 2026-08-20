import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { productService } from '../../services/productService'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'
import { formatVnd } from '../../utils/format'

const PAGE_SIZE = 15

export default function ProductsPanel() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const load = useCallback((isRefresh) => {
    isRefresh ? setRefreshing(true) : setLoading(true)
    productService.getAll()
      .then((data) => {
        setProducts(data || [])
        setVisibleCount(PAGE_SIZE)
      })
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được danh sách sản phẩm' }))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [])

  useEffect(() => { load(false) }, [load])

  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [debouncedSearch])

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) =>
      p.productName?.toLowerCase().includes(q) || p.productCode?.toLowerCase().includes(q)
    )
  }, [products, debouncedSearch])

  const displayedProducts = filtered.slice(0, visibleCount)
  const hasMore = displayedProducts.length < filtered.length

  const handleEndReached = () => {
    if (!hasMore) return
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }

  return (
    <View style={styles.root}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Sản phẩm</Text>
        <View style={styles.countBadge}><Text style={styles.countBadgeText}>{filtered.length}</Text></View>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Tìm theo tên hoặc mã sản phẩm..."
        placeholderTextColor={admin.textMuted}
        value={search}
        onChangeText={setSearch}
      />

      {loading ? (
        <ActivityIndicator style={styles.loader} color={admin.primary} />
      ) : (
        <FlatList
          data={displayedProducts}
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
                <Text style={styles.code}>{item.productCode}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.category}>{item.categoryName || item.unitTypeName || item.unit || '-'}</Text>
                <Text style={styles.stock}>Tồn: {item.stockQuantity}</Text>
              </View>
              <Text style={styles.price}>{formatVnd(item.price)}đ</Text>
            </View>
          )}
          ListFooterComponent={
            hasMore ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={admin.primary} />
              </View>
            ) : null
          }
          ListEmptyComponent={<Text style={styles.empty}>Chưa có sản phẩm nào</Text>}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingTop: 16 },
  heading: { fontFamily: fonts.adminDisplayBold, fontSize: 17, color: admin.text },
  countBadge: { backgroundColor: admin.manualBadgeBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontFamily: fonts.adminBodySemiBold, fontSize: 12.5, color: admin.textMuted },
  search: {
    marginHorizontal: 16, marginTop: 12, paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: admin.border, borderRadius: 8, backgroundColor: admin.card,
    fontSize: 13.5, color: admin.text, fontFamily: fonts.adminBody,
  },
  loader: { marginTop: 40 },
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderRadius: 10, padding: 13 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  name: { flex: 1, fontFamily: fonts.adminBodySemiBold, fontSize: 14.5, color: admin.text },
  code: { fontFamily: fonts.adminBody, fontSize: 12.5, color: admin.textMuted },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  category: { fontFamily: fonts.adminBody, fontSize: 13, color: admin.primary },
  stock: { fontFamily: fonts.adminBody, fontSize: 13, color: admin.textMuted },
  price: { fontFamily: fonts.adminDisplayBold, fontSize: 15, color: admin.text, marginTop: 6 },
  empty: { textAlign: 'center', marginTop: 40, color: admin.textMuted, fontFamily: fonts.adminBody, fontSize: 14 },
  footerLoader: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14 },
})
