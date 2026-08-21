import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FlatList, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { productService } from '../../services/productService'
import { useCart } from '../../context/cart-context'
import { useAuth } from '../../context/auth-context'
import ProductCard from './ProductCard'
import ProductDetailModal from './ProductDetailModal'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useCachedResource } from '../../hooks/useCachedResource'
import { CACHE_KEYS, formatCacheAge } from '../../services/cache'
import { ProductCardSkeleton } from '../ui/Skeleton'
import { tapFeedback } from '../../services/haptics'
import { brand } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

const ALL_CATEGORY = 'Tất cả'
const PAGE_SIZE = 8

// Danh sách sản phẩm có tìm kiếm + lọc danh mục + lazy loading + xem chi tiết.
// Toàn bộ trang (kể cả phần header truyền từ ngoài vào qua ListHeaderComponent)
// cuộn qua một FlatList ảo hoá duy nhất, tránh render hết toàn bộ sản phẩm cùng lúc.
export default function ProductCatalog({ hideHeading, reloadKey, ListHeaderComponent, refreshing, onRefresh }) {
  const { addItem } = useCart()
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 250)
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [detailProduct, setDetailProduct] = useState(null)

  // Cache-then-network: mở app là thấy ngay danh sách của lần vào trước (kể cả
  // đang mất sóng), request nền chạy song song để cập nhật.
  const {
    data,
    loading,
    isStale,
    cachedAt,
    isOnline,
    reload,
  } = useCachedResource(CACHE_KEYS.products, () => productService.getAll())

  const allProducts = data ?? []

  // HomeScreen tăng reloadKey khi người dùng kéo refresh — bỏ qua lần đầu vì
  // useCachedResource đã tự tải rồi.
  const isFirstReloadKey = useRef(true)
  useEffect(() => {
    if (isFirstReloadKey.current) {
      isFirstReloadKey.current = false
      return
    }
    reload()
  }, [reloadKey, reload])

  // Reset phân trang khi tìm kiếm hoặc đổi danh mục
  useEffect(() => {
    setVisibleCount(PAGE_SIZE)
  }, [debouncedSearch, activeCategory])

  const categoryNames = useMemo(
    () => [...new Set(allProducts.map((p) => p.categoryName || p.category || 'Khác'))],
    [allProducts]
  )

  const products = useMemo(() => {
    return allProducts.filter((p) => {
      const catName = p.categoryName || p.category || 'Khác'
      const matchesCategory = activeCategory === ALL_CATEGORY || catName === activeCategory
      const matchesSearch = p.productName.toLowerCase().includes(debouncedSearch.trim().toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [allProducts, debouncedSearch, activeCategory])

  const displayedProducts = useMemo(() => {
    return products.slice(0, visibleCount)
  }, [products, visibleCount])

  const hasMore = displayedProducts.length < products.length

  // Sản phẩm đã có sẵn trong state, chỉ cắt thêm một lát mảng — trước đây bọc
  // trong setTimeout 250ms nên mỗi lần "Xem thêm" đều có một nhịp khựng vô cớ.
  const handleLoadMore = useCallback(() => {
    if (!hasMore) return
    setVisibleCount((prev) => prev + PAGE_SIZE)
  }, [hasMore])

  // useCallback ở đây không phải trang trí: ProductCard đã memo, nên nếu
  // handleAddToCart tạo mới mỗi lần render thì props đổi và memo vô tác dụng.
  const handleAddToCart = useCallback((product) => {
    tapFeedback()
    addItem(product, 1)
    Toast.show({ type: 'success', text1: `Đã thêm ${product.productName}` })
  }, [addItem])

  const renderItem = useCallback(({ item }) => (
    <View style={styles.gridItem}>
      <ProductCard product={item} onPress={setDetailProduct} onAddToCart={handleAddToCart} hideAddToCart={isAdmin} />
    </View>
  ), [handleAddToCart, isAdmin])

  const renderHeader = () => (
    <>
      {ListHeaderComponent}

      <View style={styles.controls}>
        {!hideHeading && (
          <>
            <Text style={styles.catalogTitle}>Danh mục sản phẩm</Text>
            <Text style={styles.catalogSubtitle}>Vật liệu xây dựng chính hãng, đảm bảo chất lượng</Text>
          </>
        )}

        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm sản phẩm..."
          placeholderTextColor={brand.textMuted}
          value={search}
          onChangeText={setSearch}
        />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow} contentContainerStyle={styles.chipsRowContent}>
          {[ALL_CATEGORY, ...categoryNames].map((name) => {
            const active = name === activeCategory
            return (
              <TouchableOpacity
                key={name}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setActiveCategory(name)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{name}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {/* Đang xem bản lưu trên máy: nói rõ cũ cỡ nào thay vì để người dùng
            tưởng đây là giá và tồn kho mới nhất. */}
        {isStale && !loading && (
          <View style={styles.staleBar}>
            <Text style={styles.staleText}>
              {isOnline
                ? `Chưa cập nhật được — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`
                : `Đang ngoại tuyến — dữ liệu lưu lúc ${formatCacheAge(cachedAt)}`}
            </Text>
          </View>
        )}
      </View>
    </>
  )

  // Khung xương lưới sản phẩm trong lúc tải lần đầu (chưa có cache để hiện).
  const renderSkeletonGrid = () => (
    <View style={styles.skeletonGrid}>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={styles.skeletonItem}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  )

  // Rỗng vì mất mạng và chưa từng có cache là chuyện khác hẳn với "không tìm
  // thấy sản phẩm phù hợp" — đừng để người dùng tưởng cửa hàng hết hàng.
  const renderEmpty = () => {
    if (!isOnline && allProducts.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Chưa có dữ liệu ngoại tuyến</Text>
          <Text style={styles.empty}>
            Hãy kết nối mạng một lần để tải danh sách sản phẩm về máy, sau đó vẫn xem được khi mất sóng.
          </Text>
        </View>
      )
    }
    return <Text style={styles.empty}>Không tìm thấy sản phẩm phù hợp</Text>
  }

  const renderFooter = () => {
    if (loading || !hasMore) return null
    return (
      <TouchableOpacity style={styles.loadMoreBtn} onPress={handleLoadMore} activeOpacity={0.8}>
        <Text style={styles.loadMoreText}>
          Xem thêm ({displayedProducts.length}/{products.length} sản phẩm) ↓
        </Text>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.catalog}>
      <FlatList
        data={loading ? [] : displayedProducts}
        keyExtractor={(p) => String(p.id)}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={loading ? renderSkeletonGrid() : renderEmpty()}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[brand.primary]} tintColor={brand.primary} />
          ) : undefined
        }
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={5}
      />

      <ProductDetailModal
        visible={!!detailProduct}
        product={detailProduct}
        hideAddToCart={isAdmin}
        onClose={() => setDetailProduct(null)}
        onAddToCart={(product) => { handleAddToCart(product); setDetailProduct(null) }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  catalog: { flex: 1 },
  listContent: { paddingBottom: 24 },
  controls: { paddingHorizontal: 18, paddingTop: 22 },
  catalogTitle: { fontFamily: fonts.displayExtraBold, fontSize: 19, color: brand.ink, textAlign: 'center' },
  catalogSubtitle: { fontFamily: fonts.body, fontSize: 13, color: brand.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  searchInput: {
    width: '100%', paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1.5, borderColor: brand.ink,
    borderRadius: 10, fontSize: 14, backgroundColor: brand.white, marginBottom: 12, color: brand.ink, fontFamily: fonts.body,
  },
  chipsRow: { marginBottom: 16 },
  chipsRowContent: { gap: 6, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: brand.ink,
    borderRadius: 9, backgroundColor: brand.white,
  },
  chipActive: { backgroundColor: brand.ink },
  chipText: { fontFamily: fonts.displayBold, fontSize: 13, color: brand.ink },
  chipTextActive: { color: brand.accent },
  row: { gap: 12, paddingHorizontal: 18 },
  gridItem: { flex: 1, marginBottom: 12 },
  staleBar: {
    backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A',
    borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10, marginBottom: 14,
  },
  staleText: { fontFamily: fonts.bodyMedium, fontSize: 13.5, color: '#92400E', textAlign: 'center' },
  skeletonGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 18 },
  // Không dùng chung gridItem (flex: 1) vì trong flexWrap mỗi ô sẽ chiếm trọn
  // một hàng — cần chiều rộng cố định để xếp đúng 2 cột như lưới thật.
  skeletonItem: { width: '47%' },
  emptyWrap: { paddingHorizontal: 18, marginTop: 12, gap: 6 },
  emptyTitle: { fontFamily: fonts.displayBold, fontSize: 17, color: brand.ink, textAlign: 'center' },
  loadMoreBtn: {
    marginHorizontal: 18,
    marginTop: 8,
    marginBottom: 16,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: brand.ink,
    borderRadius: 10,
    backgroundColor: brand.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: {
    fontFamily: fonts.displayBold,
    fontSize: 14,
    color: brand.ink,
  },
  empty: { width: '100%', textAlign: 'center', color: brand.textMuted, fontFamily: fonts.body, fontSize: 14, marginTop: 16, paddingHorizontal: 18 },
})
