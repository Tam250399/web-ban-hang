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

const extra = Constants.expoConfig?.extra ?? {}

// ─────────────────────────────────────────────────────────────────────────
// Cấu hình cho bản build phát hành, theo thứ tự ưu tiên:
//
//   1. extra.apiUrl  — URL đầy đủ, ưu tiên dùng cái này:
//                      "https://api.lysau.vn"
//   2. extra.apiHost (+ extra.apiPort tuỳ chọn) — cách cũ, giữ lại để không
//                      phá cấu hình đang chạy.
//
// CẢNH BÁO BẢO MẬT: nếu URL cuối cùng là http:// thì cookie phiên `access_token`
// đi qua mạng ở dạng không mã hoá, ai bắt được gói tin trong cùng LAN là chiếm
// được phiên. Nghiêm trọng hơn, backend đặt cookie với `Secure = !IsDevelopment()`
// (Backend/SalesManagerBE/Controllers/AuthController.cs) — deploy backend với
// ASPNETCORE_ENVIRONMENT=Production mà client vẫn gọi qua http thì cookie sẽ
// KHÔNG được lưu và đăng nhập thất bại im lặng, không báo lỗi gì.
// => Chỉ dùng http cho môi trường thử nội bộ; chạy thật phải có domain + HTTPS.
// ─────────────────────────────────────────────────────────────────────────
function resolveProdServerUrl() {
  if (extra.apiUrl) return String(extra.apiUrl).replace(/\/+$/, '')
  const host = extra.apiHost ?? 'localhost'
  return extra.apiPort ? `http://${host}:${extra.apiPort}` : `https://${host}`
}

export const SERVER_URL = __DEV__
  ? `http://${resolveDevHost()}:${DEV_SERVER_PORT}`
  : resolveProdServerUrl()

// Host dùng để viết lại URL ảnh MinIO (xem resolveMediaUrl bên dưới).
export const API_HOST = (() => {
  try {
    return new URL(SERVER_URL).hostname
  } catch {
    return 'localhost'
  }
})()

export const BASE_URL = `${SERVER_URL}/api`
export const HUB_URL = `${SERVER_URL}/chathub`

if (__DEV__ && !SERVER_URL.startsWith('http')) {
  console.warn('[config] SERVER_URL không hợp lệ:', SERVER_URL)
}

// Backend trả URL ảnh MinIO cứng dạng "http://localhost:9000/..." (đúng khi trình
// duyệt và backend chạy chung máy dev, nhưng "localhost" trên điện thoại lại là
// chính điện thoại). Viết lại host về đúng API_HOST đã suy ra ở trên, giữ nguyên
// cổng 9000 của MinIO.
// Hàm này được gọi trong render của từng ProductCard/bong bóng chat, mà `new URL()`
// (polyfill react-native-url-polyfill) không hề rẻ — cache lại theo URL gốc vì
// cùng một ảnh xuất hiện lại liên tục khi cuộn danh sách.
const mediaUrlCache = new Map()

export function resolveMediaUrl(url) {
  if (!url) return url
  const cached = mediaUrlCache.get(url)
  if (cached !== undefined) return cached

  let resolved = url
  try {
    const parsed = new URL(url)
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      parsed.hostname = API_HOST
      resolved = parsed.toString()
    }
  } catch {
    // URL không parse được thì dùng nguyên trạng.
  }
  mediaUrlCache.set(url, resolved)
  return resolved
}
