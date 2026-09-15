import { useCallback, useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/auth-context'
import { useCart } from '../context/cart-context'
import { orderService } from '../services/orderService'
import { chatService } from '../services/chatService'
import { bannerService } from '../services/bannerService'
import HazardStripe from '../components/ui/HazardStripe'
import { BellIcon, CartIcon } from '../components/ui/icons'
import BrandTag from '../components/ui/BrandTag'
import LogoBadge from '../components/ui/LogoBadge'
import { PrimaryButton } from '../components/ui/Buttons'
import ProductCatalog from '../components/home/ProductCatalog'
import BannerCarousel from '../components/home/BannerCarousel'
import AdminNotificationModal from '../components/admin/AdminNotificationModal'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'

export default function HomeScreen({ navigation }) {
  const { isGuest, user } = useAuth()
  const { totalCount } = useCart()
  const isAdmin = user?.role === 'Admin'

  const [pendingOrderCount, setPendingOrderCount] = useState(0)
  const [chatUnreadCount, setChatUnreadCount] = useState(0)
  const [notifModalOpen, setNotifModalOpen] = useState(false)

  const [banners, setBanners] = useState([])

  useEffect(() => {
    bannerService.getActive().then(setBanners).catch(() => {})
  }, [])

  const loadAdminCounts = useCallback(() => {
    if (!isAdmin) return
    orderService.getAll('Pending')
      .then((orders) => setPendingOrderCount(orders?.length || 0))
      .catch(() => {})
    chatService.getConversations()
      .then((convs) => {
        const total = (convs || []).reduce((sum, c) => sum + (c.unreadCount || 0), 0)
        setChatUnreadCount(total)
      })
      .catch(() => {})
  }, [isAdmin])

  useEffect(() => {
    loadAdminCounts()
    const unsubscribe = navigation.addListener('focus', loadAdminCounts)
    return unsubscribe
  }, [loadAdminCounts, navigation])

  const [refreshing, setRefreshing] = useState(false)
  const [catalogReloadKey, setCatalogReloadKey] = useState(0)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    setCatalogReloadKey((k) => k + 1)
    loadAdminCounts()
    try {
      const data = await bannerService.getActive()
      setBanners(data)
    } catch {
    }
    setRefreshing(false)
  }, [loadAdminCounts])

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.headerTop}>
          <LogoBadge size={40} />
          <View style={styles.headerTitles}>
            <Text style={styles.storeName} numberOfLines={1}>Cửa Hàng VLXD Lý Sáu</Text>
            <Text style={styles.storeSubtitle} numberOfLines={1}>Nhà phân phối xi măng Sài Sơn</Text>
          </View>

          {isAdmin ? (
            <TouchableOpacity style={styles.notifBtn} onPress={() => setNotifModalOpen(true)} hitSlop={8} accessibilityLabel="Thông báo">
              <BellIcon size={23} color="#0F172A" />
              {(pendingOrderCount + chatUnreadCount) > 0 && (
                <View style={[styles.notifBadge, styles.orderBadge]}>
                  <Text style={styles.notifBadgeText}>
                    {(pendingOrderCount + chatUnreadCount) > 99 ? '99+' : (pendingOrderCount + chatUnreadCount)}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cartBtn} onPress={() => navigation.navigate('Cart')} hitSlop={8} accessibilityLabel="Giỏ hàng">
              <CartIcon size={23} color="#0F172A" />
              {totalCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalCount > 99 ? '99+' : totalCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>

        {isGuest && (
          <View style={styles.guestRow}>
            <PrimaryButton title="Đăng nhập" style={styles.guestBtnSolid} onPress={() => navigation.navigate('Login')} />
          </View>
        )}
      </SafeAreaView>

      <AdminNotificationModal
        visible={notifModalOpen}
        onClose={() => {
          setNotifModalOpen(false)
          loadAdminCounts()
        }}
        navigation={navigation}
      />

      <HazardStripe />

      <ProductCatalog
        reloadKey={catalogReloadKey}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        ListHeaderComponent={
          banners.length > 0 ? (
            <BannerCarousel banners={banners} />
          ) : (
            <View style={styles.hero}>
              <BrandTag label="Nhà phân phối xi măng Sài Sơn" style={styles.heroTag} />
              <Text style={styles.heroTitle}>
                Vật liệu chất lượng — <Text style={styles.heroTitleAccent}>Giá tốt nhất</Text>
              </Text>
              <Text style={styles.heroText}>
                Chuyên bán buôn - bán lẻ vật liệu xây dựng chính hãng. Giao hàng tận công trình, hỗ trợ tư vấn 24/7.
              </Text>
              <View style={styles.statsRow}>
                <Stat value="500+" label="Loại sản phẩm" />
                <Stat value="1.200+" label="Khách hàng" />
                <Stat value="10+" label="Năm kinh nghiệm" />
              </View>
            </View>
          )
        }
      />
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
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  headerSafeArea: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 },
  headerTitles: { flex: 1, minWidth: 0 },
  storeName: { color: '#0F172A', fontFamily: fonts.displayExtraBold, fontSize: 16 },
  storeSubtitle: { color: brand.primary, fontFamily: fonts.monoBold, fontSize: 12.5, marginTop: 1 },

  adminNotifRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  notifBtn: { padding: 4, position: 'relative' },
  notifIcon: { fontSize: 20 },
  notifBadge: {
    position: 'absolute', top: -5, right: -7, minWidth: 19, height: 19, borderRadius: 999,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  orderBadge: { backgroundColor: brand.primary },
  chatBadge: { backgroundColor: '#2563EB' },
  notifBadgeText: { color: brand.white, fontSize: 11, fontFamily: fonts.bodyBold },

  cartBtn: { padding: 4 },
  cartIcon: { fontSize: 20 },
  cartBadge: {
    position: 'absolute', top: -5, right: -9, minWidth: 19, height: 19, borderRadius: 999,
    backgroundColor: brand.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  cartBadgeText: { color: brand.white, fontSize: 11.5, fontFamily: fonts.bodyBold },

  guestRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingBottom: 16 },
  guestBtn: { flex: 1, paddingVertical: 9 },
  guestBtnSolid: { flex: 1, paddingVertical: 9 },
  hero: { backgroundColor: '#0F172A', paddingHorizontal: 18, paddingTop: 26, paddingBottom: 24 },
  heroTag: { marginBottom: 14 },
  heroTitle: { color: brand.white, fontFamily: fonts.displayExtraBold, fontSize: 26, lineHeight: 30, marginBottom: 10 },
  heroTitleAccent: { color: brand.primary },
  heroText: { color: '#94A3B8', fontFamily: fonts.body, fontSize: 14, lineHeight: 20, marginBottom: 18 },
  statsRow: { flexDirection: 'row', gap: 18 },
  stat: {},
  statValue: { color: brand.primary, fontFamily: fonts.monoBold, fontSize: 19 },
  statLabel: { color: '#94A3B8', fontSize: 12.5, marginTop: 2 },
})

