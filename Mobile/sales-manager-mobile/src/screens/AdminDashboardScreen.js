import { useEffect, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { useAuth } from '../context/auth-context'
import AdminHeader from '../components/admin/AdminHeader'
import AdminNavTabs from '../components/admin/AdminNavTabs'
import ProductsPanel from '../components/admin/ProductsPanel'
import CustomersPanel from '../components/admin/CustomersPanel'
import OrdersPanel from '../components/admin/OrdersPanel'
import StockPanel from '../components/admin/StockPanel'
import StatisticsPanel from '../components/admin/StatisticsPanel'
import { admin } from '../theme/colors'
import { fonts } from '../theme/fonts'

const PANELS = {
  products: ProductsPanel,
  orders: OrdersPanel,
  stock: StockPanel,
  customers: CustomersPanel,
  stats: StatisticsPanel,
}

export default function AdminDashboardScreen({ navigation, route }) {
  const { user } = useAuth()
  const [navTab, setNavTab] = useState(route?.params?.initialTab || 'stock')

  useEffect(() => {
    if (route?.params?.initialTab) {
      setNavTab(route.params.initialTab)
    }
  }, [route?.params?.initialTab])

  useEffect(() => {
    if (user.role !== 'Admin') navigation.replace('Home')
  }, [user.role])

  if (user.role !== 'Admin') return null

  const Panel = PANELS[navTab]

  return (
    <View style={styles.root}>
      <AdminHeader />
      <AdminNavTabs active={navTab} onChange={setNavTab} />

      {Panel ? (
        <Panel />
      ) : (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Chờ thiết kế để triển khai màn này.</Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: admin.bg },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  placeholderText: { fontFamily: fonts.adminBody, fontSize: 13, color: admin.textMuted },
})
