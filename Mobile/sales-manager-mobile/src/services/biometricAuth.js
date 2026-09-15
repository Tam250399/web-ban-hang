import * as LocalAuthentication from 'expo-local-authentication'

/**
 * Hàm kiểm tra điều kiện isBiometricAvailable
 */
export async function isBiometricAvailable() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  if (!hasHardware) return false
  const isEnrolled = await LocalAuthentication.isEnrolledAsync()
  return isEnrolled
}

/**
 * Hàm lấy dữ liệu getBiometricLabel
 */
export async function getBiometricLabel() {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID'
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'vân tay'
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'mống mắt'
  return 'sinh trắc học'
}

/**
 * Hàm authenticateBiometric: thực thi chức năng xử lý của module
 */
export async function authenticateBiometric(promptMessage) {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: promptMessage || 'Xác thực để đăng nhập',
    cancelLabel: 'Hủy',
    disableDeviceFallback: false,
  })
  return result.success
}
