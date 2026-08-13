import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import Toast from 'react-native-toast-message'
import { productService } from '../../services/productService'
import { useCart } from '../../context/cart-context'
import ProductCard from './ProductCard'
import ProductDetailModal from './ProductDetailModal'
import { brand } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

const ALL_CATEGORY = 'Tất cả'

// Danh sách sản phẩm có tìm kiếm + lọc danh mục + xem chi tiết — dùng chung cho
// cả phần "Danh mục sản phẩm" trên Trang chủ lẫn tab Sản phẩm.
export default function ProductCatalog({ hideHeading }) {
  const { addItem } = useCart()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY)
  const [allProducts, setAllProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailProduct, setDetailProduct] = useState(null)

  useEffect(() => {
    productService.getAll()
      .then(setAllProducts)
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được danh sách sản phẩm' }))
      .finally(() => setLoading(false))
  }, [])

  // Suy ra danh mục trực tiếp từ danh sách sản phẩm (giống TrangChu.jsx bên web)
  // thay vì gọi categoryService riêng — endpoint đó chỉ dành cho Admin/Staff nên
  // tài khoản khách hàng gọi vào sẽ bị 403.
  const categoryNames = useMemo(
    () => [...new Set(allProducts.map((p) => p.categoryName || p.category || 'Khác'))],
    [allProducts]
  )

  const products = useMemo(() => {
    return allProducts.filter((p) => {
      const catName = p.categoryName || p.category || 'Khác'
      const matchesCategory = activeCategory === ALL_CATEGORY || catName === activeCategory
      const matchesSearch = p.productName.toLowerCase().includes(search.trim().toLowerCase())
      return matchesCategory && matchesSearch
    })
  }, [allProducts, search, activeCategory])

  const handleAddToCart = (product) => {
    addItem(product, 1)
    Toast.show({ type: 'success', text1: `Đã thêm ${product.productName}` })
  }

  return (
    <View style={styles.catalog}>
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

      {loading ? (
        <ActivityIndicator style={styles.loader} color={brand.primary} />
      ) : (
        <View style={styles.grid}>
          {products.map((p, i) => (
            <View key={p.id} style={[styles.gridItem, i % 2 === 0 ? styles.gridItemLeft : styles.gridItemRight]}>
              <ProductCard product={p} onPress={setDetailProduct} onAddToCart={handleAddToCart} />
            </View>
          ))}
          {products.length === 0 && (
            <Text style={styles.empty}>Không tìm thấy sản phẩm phù hợp</Text>
          )}
        </View>
      )}

      <ProductDetailModal
        visible={!!detailProduct}
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={(product) => { handleAddToCart(product); setDetailProduct(null) }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  catalog: { paddingHorizontal: 18, paddingTop: 22 },
  catalogTitle: { fontFamily: fonts.displayExtraBold, fontSize: 19, color: brand.ink, textAlign: 'center' },
  catalogSubtitle: { fontFamily: fonts.body, fontSize: 12, color: brand.textMuted, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  searchInput: {
    width: '100%', paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1.5, borderColor: brand.ink,
    borderRadius: 10, fontSize: 13, backgroundColor: brand.white, marginBottom: 12, color: brand.ink, fontFamily: fonts.body,
  },
  chipsRow: { marginBottom: 16 },
  chipsRowContent: { gap: 6, paddingBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1.5, borderColor: brand.ink,
    borderRadius: 9, backgroundColor: brand.white,
  },
  chipActive: { backgroundColor: brand.ink },
  chipText: { fontFamily: fonts.displayBold, fontSize: 12, color: brand.ink },
  chipTextActive: { color: brand.accent },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  gridItem: { width: '50%', paddingHorizontal: 6, marginBottom: 12 },
  gridItemLeft: {},
  gridItemRight: {},
  loader: { marginTop: 24 },
  empty: { width: '100%', textAlign: 'center', color: brand.textMuted, fontFamily: fonts.body, fontSize: 13, marginTop: 16 },
})
