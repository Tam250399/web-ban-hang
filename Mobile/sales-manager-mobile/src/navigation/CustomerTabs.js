import { Text } from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import HomeScreen from '../screens/HomeScreen'
import MyOrdersScreen from '../screens/MyOrdersScreen'
import CustomerChatScreen from '../screens/CustomerChatScreen'
import StockExportTabScreen from '../screens/StockExportTabScreen'
import CartScreen from '../screens/CartScreen'
import AdminChatScreen from '../screens/AdminChatScreen'
import AccountScreen from '../screens/AccountScreen'
import { useAuth } from '../context/auth-context'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'

const Tab = createMaterialTopTabNavigator()

export default function CustomerTabs() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'Admin'
  const insets = useSafeAreaInsets()

  const TAB_ICONS = {
    Home: '🏠',
    Orders: '📋',
    Products: isAdmin ? '📤' : '💬',
    Cart: isAdmin ? '💬' : '🛒',
    Account: '👤',
  }
  const TAB_LABELS = {
    Home: 'Trang chủ',
    Orders: 'Đơn hàng',
    Products: isAdmin ? 'Xuất kho' : 'Chat',
    Cart: isAdmin ? 'Chat' : 'Giỏ hàng',
    Account: 'Tài khoản',
  }

  return (
    <Tab.Navigator
      tabBarPosition="bottom"
      screenOptions={({ route }) => ({
        swipeEnabled: true,
        lazy: true,
        tabBarScrollEnabled: false,
        tabBarPressColor: 'transparent',
        tabBarIndicatorStyle: { backgroundColor: brand.primary, height: 3, top: 0 },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          height: 62 + insets.bottom,
          paddingBottom: insets.bottom,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarItemStyle: { height: 60, paddingVertical: 0 },
        tabBarIcon: () => <Text style={{ fontSize: 19 }}>{TAB_ICONS[route.name]}</Text>,
        tabBarLabel: ({ color }) => (
          <Text style={{ fontSize: 11, fontFamily: fonts.displayBold, color, marginTop: -2 }}>
            {TAB_LABELS[route.name]}
          </Text>
        ),
        tabBarActiveTintColor: brand.primary,
        tabBarInactiveTintColor: '#94A3B8',
        tabBarShowIcon: true,
        tabBarIconStyle: { marginTop: 6, width: 24, height: 24 },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      {!isAdmin && <Tab.Screen name="Orders" component={MyOrdersScreen} />}
      <Tab.Screen name="Products" component={isAdmin ? StockExportTabScreen : CustomerChatScreen} />
      <Tab.Screen name="Cart" component={isAdmin ? AdminChatScreen : CartScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  )
}
