import 'react-native-url-polyfill/auto'
import { useEffect, useState } from 'react'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { AuthProvider } from './src/context/AuthContext'
import { useAuth } from './src/context/auth-context'
import { CartProvider } from './src/context/CartContext'
import { NetworkProvider } from './src/context/NetworkContext'
import RootNavigator from './src/navigation/RootNavigator'
import { useAppFonts } from './src/theme/fonts'
import { toastConfig } from './src/components/ui/toastConfig'
import ErrorBoundary from './src/components/ui/ErrorBoundary'
import AppLockGate from './src/components/ui/AppLockGate'
import OfflineBanner from './src/components/ui/OfflineBanner'

SplashScreen.preventAutoHideAsync().catch(() => {})

const MAX_RESTORE_WAIT_MS = 2500

function AppContent() {
  const [fontsLoaded, fontError] = useAppFonts()
  const { restoring } = useAuth()
  const [restoreTimedOut, setRestoreTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setRestoreTimedOut(true), MAX_RESTORE_WAIT_MS)
    return () => clearTimeout(timer)
  }, [])

  const ready = (fontsLoaded || !!fontError) && (!restoring || restoreTimedOut)

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {})
  }, [ready])

  if (!ready) return null

  return (
    <>
      <OfflineBanner />
      <RootNavigator />
      <StatusBar style="dark" />
      <AppLockGate />
    </>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <NetworkProvider>
          <AuthProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AuthProvider>
        </NetworkProvider>
      </ErrorBoundary>
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  )
}
