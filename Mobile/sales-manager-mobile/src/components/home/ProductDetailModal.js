import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Image } from 'expo-image'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { brand } from '../../theme/colors'
import { fonts } from '../../theme/fonts'
import { resolveMediaUrl } from '../../services/config'
import { formatVnd } from '../../utils/format'
import { Icon, ICON_ROW } from '../ui/Icon'

const BLURHASH = 'L5H2EC=PM+yV0g-mq.wG9c010J}I'

const CATEGORY_ICONS = {
  'Xi măng': 'cement',
  'Gạch': 'brick',
  'Cát - Đá': 'pickaxe',
  'Thép': 'bolt',
  'Tôn - Mái': 'roof',
  'Cửa - Khung': 'door',
  'Sơn': 'palette',
}

/**
 * Hộp thoại hiển thị chi tiết thông tin và hình ảnh sản phẩm
 */
export default function ProductDetailModal({ visible, product, onClose, onAddToCart, hideAddToCart }) {
  if (!product) return null

  const catName = product.categoryName || product.category || 'Khác'
  const unitName = product.unitTypeName || product.unit || ''
  const icon = CATEGORY_ICONS[catName] || 'box'
  const lowStock = product.stockQuantity < 50
  const outOfStock = product.stockQuantity <= 0

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={8} accessibilityLabel="Đóng">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
            <View style={styles.imageWrap}>
              {product.imageUrl ? (
                <Image
                  source={{
                    uri: resolveMediaUrl(product.imageUrl),
                    headers: { Accept: 'image/webp,image/*;q=0.8' },
                  }}
                  style={styles.image}
                  contentFit="cover"
                  placeholder={{ blurhash: BLURHASH }}
                  transition={200}
                  cachePolicy="memory-disk"
                  priority="high"
                />
              ) : (
                <Text style={styles.imageIcon}>{icon}</Text>
              )}
              {lowStock && !outOfStock && (
                <View style={styles.lowStockBadge}>
                  <Text style={styles.lowStockBadgeText}>Sắp hết hàng</Text>
                </View>
              )}
            </View>

            <Text style={styles.category}>{catName}</Text>
            <Text style={styles.name}>{product.productName}</Text>
            <Text style={styles.code}>Mã SP: <Text style={styles.codeValue}>{product.productCode}</Text></Text>

            <View style={styles.priceRow}>
              <Text style={styles.price}>{formatVnd(product.price)}đ</Text>
              {!!unitName && <Text style={styles.unit}> / {unitName}</Text>}
            </View>

            <View style={styles.meta}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Đơn vị tính</Text>
                <Text style={styles.metaValue}>{unitName || '—'}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Tồn kho</Text>
                <Text style={[styles.metaValue, lowStock ? styles.warnText : styles.okText]}>
                  {product.stockQuantity} {unitName}
                </Text>
                <Icon
                  name={lowStock ? 'alert' : 'checkRing'}
                  size={15}
                  color={lowStock ? brand.danger : brand.success}
                  label={lowStock ? 'Sắp hết hàng' : 'Còn hàng'}
                />
              </View>
              {!!product.description && (
                <View style={styles.descBlock}>
                  <Text style={styles.metaLabel}>Mô tả</Text>
                  <Text style={styles.descText}>{product.description}</Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.ctaRow}>
            {!hideAddToCart && (
              <TouchableOpacity
                style={[styles.addBtn, outOfStock && styles.addBtnDisabled]}
                onPress={() => onAddToCart(product)}
                disabled={outOfStock}
              >
                <View style={ICON_ROW}>
                  {!outOfStock && <Icon name="cart" size={16} color={brand.white} />}
                  <Text style={styles.addBtnText}>{outOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}</Text>
                </View>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={hideAddToCart ? styles.addBtn : styles.closeCta}
              onPress={onClose}
            >
              <Text style={hideAddToCart ? styles.addBtnText : styles.closeCtaText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: brand.cardBorder,
  },
  headerTitle: { fontFamily: fonts.displayExtraBold, fontSize: 17, color: brand.ink },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#fca5a5',
  },
  closeBtnText: { color: '#dc2626', fontSize: 15, fontWeight: '700' },
  body: { padding: 20, paddingBottom: 12 },
  imageWrap: {
    width: '100%', height: 220, backgroundColor: '#E3DFD4', borderRadius: 16,
    borderWidth: 1.5, borderColor: brand.ink, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: 18,
  },
  image: { width: '100%', height: '100%' },
  imageIcon: { fontSize: 56 },
  lowStockBadge: {
    position: 'absolute', top: 12, left: 12, backgroundColor: brand.accent,
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4,
  },
  lowStockBadgeText: { fontFamily: fonts.bodySemiBold, fontSize: 12.5, color: brand.ink },
  category: { fontFamily: fonts.monoSemiBold, fontSize: 12.5, color: brand.primary, textTransform: 'uppercase', letterSpacing: 0.4 },
  name: { fontFamily: fonts.displayExtraBold, fontSize: 22, color: brand.ink, marginTop: 6, marginBottom: 4 },
  code: { fontFamily: fonts.body, fontSize: 13.5, color: brand.textMuted, marginBottom: 14 },
  codeValue: { fontFamily: fonts.monoBold, color: brand.ink },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  price: { fontFamily: fonts.monoBold, fontSize: 24, color: brand.ink },
  unit: { fontFamily: fonts.body, fontSize: 14, color: brand.textMuted },
  meta: { gap: 10, marginBottom: 20 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: brand.card },
  metaLabel: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: brand.textMuted },
  metaValue: { fontFamily: fonts.bodySemiBold, fontSize: 13.5, color: brand.ink },
  warnText: { color: '#b45309' },
  okText: { color: brand.success },
  descBlock: { gap: 4, paddingVertical: 8 },
  descText: { fontFamily: fonts.body, fontSize: 14, color: brand.ink, lineHeight: 20 },
  ctaRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, borderTopColor: brand.cardBorder },
  addBtn: { flex: 1, backgroundColor: brand.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  addBtnDisabled: { opacity: 0.5 },
  addBtnText: { color: brand.white, fontFamily: fonts.displayExtraBold, fontSize: 16 },
  closeCta: { flex: 1, borderWidth: 1.5, borderColor: brand.ink, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  closeCtaText: { color: brand.ink, fontFamily: fonts.displayBold, fontSize: 15 },
})
