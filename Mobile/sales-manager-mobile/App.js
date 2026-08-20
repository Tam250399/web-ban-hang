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

// Giữ màn splash gốc (logo Lý Sáu) hiện tới khi tải xong font, thay vì để lộ
// ra một khung màu trơn trong lúc chờ — tự ẩn ngay khi gọi được, không cần await.
SplashScreen.preventAutoHideAsync().catch(() => {})

// Khôi phục phiên phải gọi mạng, mà mạng thì có thể chậm hoặc chết hẳn. Quá mốc
// này thì vào app luôn ở trạng thái khách còn hơn bắt người dùng nhìn splash.
const MAX_RESTORE_WAIT_MS = 2500

function AppContent() {
  const [fontsLoaded, fontError] = useAppFonts()
  const { restoring } = useAuth()
  const [restoreTimedOut, setRestoreTimedOut] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setRestoreTimedOut(true), MAX_RESTORE_WAIT_MS)
    return () => clearTimeout(timer)
  }, [])

  // Chờ cả font lẫn phiên đăng nhập rồi mới bỏ splash. Trước đây chỉ chờ font
  // nên app hiện giao diện khách (có nút "Đăng nhập", có tab "Đơn hàng") rồi
  // mới nhảy sang giao diện admin khi /auth/me trả về — số lượng tab đổi khiến
  // tab navigator remount và người dùng bị văng khỏi tab đang xem.
  // fontError: nếu nạp font hỏng thì vào app với font hệ thống, đừng kẹt splash.
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
      {/* Đặt cuối cùng để phủ lên toàn bộ navigator khi app bị khoá. */}
      <AppLockGate />
    </>
  )
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        {/* NetworkProvider nằm ngoài cùng: AuthProvider/CartProvider và các màn
            hình bên trong đều cần biết trạng thái mạng. */}
        <NetworkProvider>
          <AuthProvider>
            <CartProvider>
              <AppContent />
            </CartProvider>
          </AuthProvider>
        </NetworkProvider>
      </ErrorBoundary>
      {/* Ngoài ErrorBoundary để toast vẫn hiện được khi cây app bên trong đã hỏng. */}
      <Toast config={toastConfig} />
    </SafeAreaProvider>
  )
}
