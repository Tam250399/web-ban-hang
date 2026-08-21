// ─────────────────────────────────────────────────────────────────────────
// Cấu hình địa chỉ backend và ảnh.
//
// Ở chế độ dev, `/api` và `/chathub` chạy được là nhờ proxy khai báo trong
// vite.config.js. Bản `vite build` chỉ ra file tĩnh — KHÔNG có proxy nào cả —
// nên nếu deploy mà không đặt reverse proxy phía trước thì `/api` sẽ trỏ vào
// chính web server và trả 404. Hai cách dùng:
//
//   1. Đặt nginx trước file tĩnh, forward /api và /chathub sang backend
//      (xem Frontend/sales-manager-fe/nginx.conf) -> giữ nguyên mặc định.
//   2. Backend nằm ở domain khác -> build với VITE_API_URL=https://api.example.com
//      và nhớ thêm origin của web vào CORS của backend.
// ─────────────────────────────────────────────────────────────────────────

const stripTrailingSlash = (value) => String(value).replace(/\/+$/, '')

const API_ORIGIN = import.meta.env.VITE_API_URL
  ? stripTrailingSlash(import.meta.env.VITE_API_URL)
  : ''

export const BASE_URL = `${API_ORIGIN}/api`
export const HUB_URL = `${API_ORIGIN}/chathub`

// ─────────────────────────────────────────────────────────────────────────
// Ảnh MinIO
//
// Backend sinh URL ảnh theo Minio:Endpoint, mặc định là "localhost:9000".
// Đúng khi trình duyệt và MinIO chạy chung máy dev, nhưng sai hoàn toàn khi
// người dùng mở web từ máy khác — "localhost" lúc đó là máy của họ.
//
// VITE_MEDIA_URL: origin công khai của MinIO (vd. https://media.example.com).
// Không đặt thì chỉ đổi hostname về đúng host đang mở web, giữ nguyên cổng —
// đủ dùng cho trường hợp MinIO expose cùng máy với backend.
// ─────────────────────────────────────────────────────────────────────────

const MEDIA_ORIGIN = import.meta.env.VITE_MEDIA_URL
  ? stripTrailingSlash(import.meta.env.VITE_MEDIA_URL)
  : ''

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '0.0.0.0'])

// Hàm này được gọi trong render của từng thẻ sản phẩm; `new URL()` không rẻ và
// cùng một ảnh lặp lại liên tục khi lọc/tìm kiếm nên cache lại theo URL gốc.
const mediaCache = new Map()

export function resolveMediaUrl(url) {
  if (!url) return url
  // blob:/data: là ảnh xem trước sinh tại chỗ khi người dùng vừa chọn file —
  // không được đụng vào.
  if (url.startsWith('blob:') || url.startsWith('data:')) return url

  const cached = mediaCache.get(url)
  if (cached !== undefined) return cached

  let resolved = url
  try {
    const parsed = new URL(url, window.location.origin)
    if (LOCAL_HOSTS.has(parsed.hostname)) {
      if (MEDIA_ORIGIN) {
        resolved = `${MEDIA_ORIGIN}${parsed.pathname}${parsed.search}`
      } else {
        parsed.hostname = window.location.hostname
        resolved = parsed.toString()
      }
    }
  } catch {
    // Không parse được thì dùng nguyên trạng.
  }

  mediaCache.set(url, resolved)
  return resolved
}
