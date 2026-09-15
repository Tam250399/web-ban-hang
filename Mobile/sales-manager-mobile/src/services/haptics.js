import * as Haptics from 'expo-haptics'

export function tapFeedback() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {})
}

export function successFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {})
}

export function errorFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {})
}

export function warningFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {})
}
