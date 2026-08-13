import 'react-native-url-polyfill/auto'
import { View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { AuthProvider } from './src/context/AuthContext'
import { CartProvider } from './src/context/CartContext'
import RootNavigator from './src/navigation/RootNavigator'
import { useAppFonts } from './src/theme/fonts'
import { brand } from './src/theme/colors'

export default function App() {
  const [fontsLoaded] = useAppFonts()

  // Mọi màn hình trong thiết kế đều có phần đầu nền tối (dark header), nên
  // dùng chung nền tối + status bar light trong lúc chờ font để tránh nháy trắng.
  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: brand.ink }} />
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <RootNavigator />
          <StatusBar style="light" />
          <Toast />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
