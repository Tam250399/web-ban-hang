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
    borderWidth: 1.5,
    borderColor: brand.ink,
    borderRadius: 14,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    width: '100%',
    height: 88,
    backgroundColor: '#E3DFD4',
    borderBottomWidth: 2,
    borderBottomColor: brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  imagePlaceholderText: { fontFamily: fonts.mono, fontSize: 9, color: brand.textFaint },
  codeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: brand.accent,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    transform: [{ rotate: '-2deg' }],
  },
  codeBadgeText: { fontFamily: fonts.monoBold, fontSize: 8, color: brand.ink },
  body: { padding: 10 },
  category: {
    fontFamily: fonts.monoSemiBold,
    fontSize: 8.5,
    color: brand.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    color: brand.ink,
    marginTop: 4,
    marginBottom: 4,
    lineHeight: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: 1,
    borderTopColor: '#B9B2A0',
    borderStyle: 'dashed',
    paddingTop: 7,
    marginTop: 6,
  },
  price: { fontFamily: fonts.monoBold, fontSize: 13, color: brand.ink },
  addBtn: {
    width: '100%',
    marginTop: 8,
    paddingVertical: 7,
    backgroundColor: brand.ink,
    borderRadius: 8,
    alignItems: 'center',
  },
  addBtnText: { color: brand.accent, fontFamily: fonts.displayBold, fontSize: 10.5 },
})
