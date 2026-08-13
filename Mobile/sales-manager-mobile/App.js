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
import { toastConfig } from './src/components/ui/toastConfig'

export default function App() {
  const [fontsLoaded] = useAppFonts()

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: brand.bg }} />
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <RootNavigator />
          <StatusBar style="dark" />
          <Toast config={toastConfig} />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  )
}
