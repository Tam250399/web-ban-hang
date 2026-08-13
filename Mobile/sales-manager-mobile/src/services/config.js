import Constants from 'expo-constants'
import { Platform } from 'react-native'

// Backend chạy dev qua `dotnet run` ở http://localhost:5000 (xem
// Backend/SalesManagerBE/Properties/launchSettings.json). Không có proxy như Vite
// nên mobile phải tự suy ra IP của máy host thay vì dùng "localhost".
const DEV_SERVER_PORT = 5000

function resolveDevHost() {
  // Trên thiết bị thật chạy qua Expo Go, hostUri chứa IP LAN của máy chạy Metro
  // (vd. "192.168.1.5:8081") -> tái dùng chính IP đó để gọi API, vì "localhost"
  // trên điện thoại là chính điện thoại, không phải máy dev.
  const hostUri = Constants.expoConfig?.hostUri
  if (hostUri) {
    const host = hostUri.split(':')[0]
    if (host && host !== 'localhost' && host !== '127.0.0.1') return host
  }
  // Android emulator (AVD) không thấy "localhost" của máy host, phải dùng địa chỉ đặc biệt 10.0.2.2.
  if (Platform.OS === 'android') return '10.0.2.2'
  return 'localhost'
}

// Khi build production, đặt IP/domain thật qua app.config.js -> extra.apiHost.
export const API_HOST = __DEV__ ? resolveDevHost() : (Constants.expoConfig?.extra?.apiHost ?? 'localhost')
export const SERVER_URL = __DEV__ ? `http://${API_HOST}:${DEV_SERVER_PORT}` : `https://${API_HOST}`
export const BASE_URL = `${SERVER_URL}/api`
export const HUB_URL = `${SERVER_URL}/chathub`

// Backend trả URL ảnh MinIO cứng dạng "http://localhost:9000/..." (đúng khi trình
// duyệt và backend chạy chung máy dev, nhưng "localhost" trên điện thoại lại là
// chính điện thoại). Viết lại host về đúng API_HOST đã suy ra ở trên, giữ nguyên
// cổng 9000 của MinIO.
export function resolveMediaUrl(url) {
  if (!url || !__DEV__) return url
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = API_HOST
      return parsed.toString()
    }
    return url
  } catch {
    return url
  }
}
