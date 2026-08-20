import * as Haptics from 'expo-haptics'

// Bọc expo-haptics để (1) không rải try/catch khắp nơi — rung là thứ "có thì
// tốt", máy không hỗ trợ hoặc người dùng tắt trong cài đặt hệ thống thì bỏ qua,
// tuyệt đối không được làm hỏng thao tác chính; và (2) giữ ngữ nghĩa ở một chỗ
// để cả app dùng nhất quán cùng một kiểu rung cho cùng một loại hành động.

/** Thao tác nhẹ, thường xuyên: thêm vào giỏ, tăng/giảm số lượng. */
export function tapFeedback() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}

/** Việc quan trọng vừa hoàn tất: đặt hàng, lưu phiếu, xác nhận đơn. */
export function successFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
}

/** Có lỗi cần người dùng chú ý. */
export function errorFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
}

/** Cảnh báo trước thao tác phá huỷ: mở hộp thoại xoá. */
export function warningFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
}
