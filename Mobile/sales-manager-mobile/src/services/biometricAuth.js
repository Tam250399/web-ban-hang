import * as LocalAuthentication from 'expo-local-authentication'

// Bọc expo-local-authentication: kiểm tra phần cứng/đã đăng ký sinh trắc học
// chưa, và tự chọn nhãn hiển thị phù hợp (Face ID / vân tay) theo loại cảm
// biến máy đang có.
export async function isBiometricAvailable() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync()
  if (!hasHardware) return false
  const isEnrolled = await LocalAuthentication.isEnrolledAsync()
  return isEnrolled
}

export async function getBiometricLabel() {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync()
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID'
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'vân tay'
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'mống mắt'
  return 'sinh trắc học'
}

export async function authenticateBiometric(promptMessage) {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: promptMessage || 'Xác thực để đăng nhập',
    cancelLabel: 'Hủy',
    disableDeviceFallback: false, // vẫn cho phép lùi về mã khóa màn hình nếu sinh trắc học lỗi
  })
  return result.success
}
