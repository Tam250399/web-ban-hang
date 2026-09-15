import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import CustomerTabs from './CustomerTabs'
import LoginScreen from '../screens/LoginScreen'
import RegisterScreen from '../screens/RegisterScreen'
import MyOrdersScreen from '../screens/MyOrdersScreen'
import AdminDashboardScreen from '../screens/AdminDashboardScreen'
import StockFormScreen from '../screens/admin/StockFormScreen'
import StockImportFormScreen from '../screens/admin/StockImportFormScreen'

const Stack = createNativeStackNavigator()

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home" screenOptions={{ headerShown: false }}>
        <Stack.Group screenOptions={{ gestureEnabled: false }}>
          <Stack.Screen name="Home" component={CustomerTabs} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Group>

        <Stack.Screen name="MyOrders" component={MyOrdersScreen} options={{ headerShown: true, title: 'Đơn hàng của tôi' }} />
        <Stack.Screen name="Admin" component={AdminDashboardScreen} />
        <Stack.Screen name="StockForm" component={StockFormScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="StockImportForm" component={StockImportFormScreen} options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
