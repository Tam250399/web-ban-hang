// Các hàm định dạng dùng chung cho toàn app. Trước đây mỗi màn hình tự khai
// báo lại formatVnd/formatDay/formatTime (12 bản formatVnd giống hệt nhau),
// vừa khó sửa đồng bộ vừa tạo formatter mới ở mỗi lần render cell.

// Intl.NumberFormat khá nặng để khởi tạo — tạo một lần rồi tái dùng thay vì
// gọi Number.toLocaleString() trong từng cell của FlatList.
const vndFormatter = new Intl.NumberFormat('vi-VN')
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })

/** 1234567 -> "1.234.567" (không kèm ký hiệu tiền tệ, các màn tự thêm "đ"). */
export function formatVnd(value) {
  return vndFormatter.format(Number(value ?? 0))
}

/** ISO string -> "20/08/2026". Trả về chuỗi rỗng nếu không parse được. */
export function formatDay(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return dateFormatter.format(d)
}

/** ISO string -> "14:05". Trả về chuỗi rỗng nếu không parse được. */
export function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return timeFormatter.format(d)
}

/** Date | ISO -> "20-08-2026" (định dạng dùng trong phiếu bán hàng/nhập kho). */
export function formatDDMMYYYY(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${day}-${month}-${d.getFullYear()}`
}

/** Date | ISO -> "2026-08-20" (định dạng gửi lên API). */
export function formatYYYYMMDD(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  return `${d.getFullYear()}-${month}-${day}`
}

export function isSameDay(a, b) {
  if (!a || !b) return false
  const da = new Date(a)
  const db = new Date(b)
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  )
}

/** Nửa đêm của ngày chứa `date` — dùng để gom nhóm/so sánh theo ngày. */
export function startOfDay(date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

export const WEEKDAYS = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']
