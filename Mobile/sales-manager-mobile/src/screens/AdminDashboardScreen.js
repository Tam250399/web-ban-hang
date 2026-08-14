import { useCallback, useEffect, useRef, useState } from 'react'
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native'
import { useAuth } from '../context/auth-context'
import AdminHeader from '../components/admin/AdminHeader'
import AdminNavTabs, { NAV_ITEMS } from '../components/admin/AdminNavTabs'
import ProductsPanel from '../components/admin/ProductsPanel'
import CustomersPanel from '../components/admin/CustomersPanel'
import OrdersPanel from '../components/admin/OrdersPanel'
import StockPanel from '../components/admin/StockPanel'
import StatisticsPanel from '../components/admin/StatisticsPanel'
import { admin } from '../theme/colors'

const TAB_COMPONENTS = {
  products: ProductsPanel,
  orders: OrdersPanel,
  stock: StockPanel,
  customers: CustomersPanel,
  stats: StatisticsPanel,
}

export default function AdminDashboardScreen({ navigation, route }) {
  const { user } = useAuth()
  const { width: windowWidth } = useWindowDimensions()
  const [containerWidth, setContainerWidth] = useState(windowWidth)
  const initialTab = route?.params?.initialTab || 'products'
  const [navTab, setNavTab] = useState(initialTab)
  const [loadedTabs, setLoadedTabs] = useState(new Set([initialTab]))
  const pagerRef = useRef(null)
  const isProgrammaticScroll = useRef(false)

  // Đảm bảo tab hiện tại luôn được đánh dấu là đã load
  useEffect(() => {
    setLoadedTabs((prev) => {
      if (prev.has(navTab)) return prev
      return new Set(prev).add(navTab)
    })
  }, [navTab])

  // Chuyển tab khi có tham số initialTab từ ngoài truyền vào
  useEffect(() => {
    if (route?.params?.initialTab) {
      handleTabChange(route.params.initialTab)
    }
  }, [route?.params?.initialTab])

  useEffect(() => {
    if (user.role !== 'Admin') navigation.replace('Home')
  }, [user.role, navigation])

  const handleTabChange = useCallback((tabId) => {
    const targetIndex = NAV_ITEMS.findIndex((item) => item.id === tabId)
    if (targetIndex !== -1 && pagerRef.current) {
      isProgrammaticScroll.current = true
      setNavTab(tabId)
      pagerRef.current.scrollTo({
        x: targetIndex * containerWidth,
        animated: true,
      })
      setTimeout(() => {
        isProgrammaticScroll.current = false
      }, 400)
    }
  }, [containerWidth])

  // Xử lý khi người dùng lướt ngang xong
  const handleScrollEnd = useCallback((e) => {
    if (isProgrammaticScroll.current) return
    const offsetX = e.nativeEvent.contentOffset.x
    const pageIndex = Math.round(offsetX / containerWidth)
    const targetItem = NAV_ITEMS[pageIndex]
    if (targetItem && targetItem.id !== navTab) {
      setNavTab(targetItem.id)
    }
  }, [containerWidth, navTab])

  if (user.role !== 'Admin') return null

  return (
    <View
      style={styles.root}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width
        if (w > 0 && w !== containerWidth) {
          setContainerWidth(w)
          const currentIndex = NAV_ITEMS.findIndex((item) => item.id === navTab)
          if (currentIndex !== -1) {
            setTimeout(() => {
              pagerRef.current?.scrollTo({ x: currentIndex * w, animated: false })
            }, 50)
          }
        }
      }}
    >
      <AdminHeader />
      <AdminNavTabs active={navTab} onChange={handleTabChange} />

      {/* ── ScrollView cuộn ngang phân trang (cho phép lướt trái / phải chuyển tab) ── */}
      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.pager}
        contentContainerStyle={styles.pagerContent}
      >
        {NAV_ITEMS.map((item) => {
          const Component = TAB_COMPONENTS[item.id]
          const isLoaded = loadedTabs.has(item.id)
          return (
            <View key={item.id} style={[styles.page, { width: containerWidth }]}>
              {isLoaded && Component ? <Component /> : <View style={styles.placeholder} />}
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: admin.bg },
  pager: { flex: 1 },
  pagerContent: { flexGrow: 1 },
  page: { flex: 1, overflow: 'hidden' },
  placeholder: { flex: 1 },
})
