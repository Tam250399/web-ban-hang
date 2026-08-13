import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/auth-context'
import { useCart } from '../context/cart-context'
import HazardStripe from '../components/ui/HazardStripe'
import BrandTag from '../components/ui/BrandTag'
import { OutlineButton, PrimaryButton } from '../components/ui/Buttons'
import ProductCatalog from '../components/home/ProductCatalog'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'

export default function HomeScreen({ navigation }) {
  const { isGuest } = useAuth()
  const { totalCount } = useCart()

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.headerTop}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>ĐL</Text>
          </View>
          <View style={styles.headerTitles}>
            <Text style={styles.storeName} numberOfLines={1}>Cửa Hàng VLXD Đức Lợi</Text>
            <Text style={styles.storeSubtitle} numberOfLines={1}>Nhà phân phối xi măng Sài Sơn</Text>
          </View>
          <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')}>
            <Text style={styles.cartIcon}>🛒</Text>
            {totalCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCount > 99 ? '99+' : totalCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {isGuest && (
          <View style={styles.guestRow}>
            <OutlineButton title="Đăng nhập" dark style={styles.guestBtn} onPress={() => navigation.navigate('Login')} />
            <PrimaryButton title="Đăng ký" style={styles.guestBtnSolid} onPress={() => navigation.navigate('Register')} />
          </View>
        )}
      </SafeAreaView>

      <HazardStripe />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.hero}>
          <BrandTag label="Nhà phân phối xi măng Sài Sơn" style={styles.heroTag} />
          <Text style={styles.heroTitle}>
            Vật liệu chất lượng — <Text style={styles.heroTitleAccent}>Giá tốt nhất</Text>
          </Text>
          <Text style={styles.heroText}>
            Chuyên bán buôn - bán lẻ vật liệu xây dựng chính hãng. Giao hàng tận công trình, hỗ trợ tư vấn 24/7.
          </Text>
          <View style={styles.heroActions}>
            <PrimaryButton title="Xem sản phẩm" style={styles.heroBtn} onPress={() => navigation.navigate('Products')} />
            {isGuest && (
              <OutlineButton title="Tạo tài khoản" dark style={styles.heroBtn} onPress={() => navigation.navigate('Register')} />
            )}
          </View>
          <View style={styles.statsRow}>
            <Stat value="500+" label="Loại sản phẩm" />
            <Stat value="1.200+" label="Khách hàng" />
            <Stat value="10+" label="Năm kinh nghiệm" />
          </View>
        </View>

        <ProductCatalog />
      </ScrollView>
    </View>
  )
}

function Stat({ value, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },
  headerSafeArea: { backgroundColor: brand.ink },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  logo: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: brand.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  logoText: { color: '#F5F2EA', fontFamily: fonts.monoBold, fontSize: 15 },
  headerTitles: { flex: 1, minWidth: 0 },
  storeName: { color: '#F5F2EA', fontFamily: fonts.displayExtraBold, fontSize: 14 },
  storeSubtitle: { color: brand.accent, fontFamily: fonts.mono, fontSize: 10.5, marginTop: 2 },
  cartBtn: { padding: 4 },
  cartIcon: { fontSize: 20 },
  cartBadge: {
    position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 999,
    backgroundColor: brand.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  cartBadgeText: { color: brand.white, fontSize: 10, fontFamily: fonts.bodyBold },
  guestRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 16 },
  guestBtn: { flex: 1, paddingVertical: 9 },
  guestBtnSolid: { flex: 1, paddingVertical: 9 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  hero: { backgroundColor: brand.ink, paddingHorizontal: 18, paddingTop: 26, paddingBottom: 24 },
  heroTag: { marginBottom: 14 },
  heroTitle: { color: brand.white, fontFamily: fonts.displayExtraBold, fontSize: 26, lineHeight: 30, marginBottom: 10 },
  heroTitleAccent: { color: brand.primary },
  heroText: { color: '#B9B2A0', fontFamily: fonts.body, fontSize: 12.5, lineHeight: 19, marginBottom: 18 },
  heroActions: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  heroBtn: { flex: 1, paddingVertical: 11 },
  statsRow: { flexDirection: 'row', gap: 18 },
  stat: {},
  statValue: { color: brand.accent, fontFamily: fonts.monoBold, fontSize: 19 },
  statLabel: { color: brand.textFaint, fontSize: 10, marginTop: 2 },
})
