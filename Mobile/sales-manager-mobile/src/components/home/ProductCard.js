import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { brand } from '../../theme/colors'
import { fonts } from '../../theme/fonts'
import { resolveMediaUrl } from '../../services/config'

function formatVnd(value) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

export default function ProductCard({ product, onPress, onAddToCart }) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(product)} activeOpacity={0.9}>
      <View style={styles.imagePlaceholder}>
        {product.imageUrl ? (
          <Image source={{ uri: resolveMediaUrl(product.imageUrl) }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.imagePlaceholderText}>ảnh sản phẩm</Text>
        )}
        <View style={styles.codeBadge}>
          <Text style={styles.codeBadgeText}>{product.productCode}</Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.category}>{product.categoryName || product.category}</Text>
        <Text style={styles.name} numberOfLines={2}>{product.productName}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{formatVnd(product.price)}đ</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => onAddToCart(product)} activeOpacity={0.85}>
          <Text style={styles.addBtnText}>🛒 Thêm vào giỏ</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  imagePlaceholder: {
    width: '100%',
    height: 105,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justify: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholderText: { fontFamily: fonts.mono, fontSize: 10, color: brand.textMuted },
  codeBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  codeBadgeText: { fontFamily: fonts.monoBold, fontSize: 9, color: '#FFFFFF' },
  body: { padding: 12 },
  category: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 9,
    color: brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#0F172A',
    marginTop: 4,
    marginBottom: 6,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    borderStyle: 'dashed',
    paddingTop: 8,
    marginTop: 4,
  },
  price: { fontFamily: fonts.monoBold, fontSize: 14, color: brand.primary },
  addBtn: {
    width: '100%',
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: brand.primary,
    borderRadius: 10,
    alignItems: 'center',
    justify: 'center',
  },
  addBtnText: { color: '#FFFFFF', fontFamily: fonts.displayBold, fontSize: 11.5 },
})
