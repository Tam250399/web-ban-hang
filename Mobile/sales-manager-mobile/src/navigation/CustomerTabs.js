import { Text } from 'react-native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import HomeScreen from '../screens/HomeScreen'
import ProductsScreen from '../screens/ProductsScreen'
import StockExportTabScreen from '../screens/StockExportTabScreen'
import CartScreen from '../screens/CartScreen'
import AdminChatScreen from '../screens/AdminChatScreen'
import AccountScreen from '../screens/AccountScreen'
import { useAuth } from '../context/auth-context'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'

const Tab = createBottomTabNavigator()

// Thanh tab dưới cùng khớp thiết kế: nền tối #1F1D1A, icon emoji, active = vàng accent.
// Với Admin, 2 tab giữa đổi vai trò: "Sản phẩm" -> "Xuất kho", "Giỏ hàng" -> "Chat"
// (Admin không mua hàng nên giỏ hàng/duyệt sản phẩm không có ý nghĩa với họ).
export default function CustomerTabs() {
  const { user } = useAuth()
  const isAdmin = user.role === 'Admin'

  const TAB_ICONS = { Home: '🏠', Products: isAdmin ? '📤' : '🏗️', Cart: isAdmin ? '💬' : '🛒', Account: '👤' }
  const TAB_LABELS = { Home: 'Trang chủ', Products: isAdmin ? 'Xuất kho' : 'Sản phẩm', Cart: isAdmin ? 'Chat' : 'Giỏ hàng', Account: 'Tài khoản' }

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: brand.accent,
        tabBarInactiveTintColor: brand.textFaint,
        tabBarStyle: { backgroundColor: brand.ink, borderTopColor: '#3A3630', height: 62, paddingBottom: 8, paddingTop: 6 },
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{TAB_ICONS[route.name]}</Text>,
        tabBarLabel: ({ color }) => (
          <Text style={{ fontSize: 9.5, fontFamily: fonts.displayBold, color }}>{TAB_LABELS[route.name]}</Text>
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Products" component={isAdmin ? StockExportTabScreen : ProductsScreen} />
      <Tab.Screen name="Cart" component={isAdmin ? AdminChatScreen : CartScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  )
}
