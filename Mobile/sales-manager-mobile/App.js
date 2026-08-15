import 'react-native-url-polyfill/auto'
import { useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { AuthProvider } from './src/context/AuthContext'
import { CartProvider } from './src/context/CartContext'
import RootNavigator from './src/navigation/RootNavigator'
import { useAppFonts } from './src/theme/fonts'
import { toastConfig } from './src/components/ui/toastConfig'
import OfflineBanner from './src/components/ui/OfflineBanner'

// Giữ màn splash gốc (logo Lý Sáu) hiện tới khi tải xong font, thay vì để lộ
// ra một khung màu trơn trong lúc chờ — tự ẩn ngay khi gọi được, không cần await.
SplashScreen.preventAutoHideAsync().catch(() => {})

export default function App() {
  const [fontsLoaded] = useAppFonts()

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync()
  }, [fontsLoaded])

  if (!fontsLoaded) {
    return null
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <OfflineBanner />
          <RootNavigator />
          <StatusBar style="dark" />
          <Toast config={toastConfig} />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
