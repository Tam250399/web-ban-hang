import * as Haptics from 'expo-haptics'

/**
 * Hàm tapFeedback: thực thi chức năng xử lý của module
 */
export function tapFeedback() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}

/**
 * Hàm successFeedback: thực thi chức năng xử lý của module
 */
export function successFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
}

/**
 * Hàm errorFeedback: thực thi chức năng xử lý của module
 */
export function errorFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
}

/**
 * Hàm warningFeedback: thực thi chức năng xử lý của module
 */
export function warningFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
}
