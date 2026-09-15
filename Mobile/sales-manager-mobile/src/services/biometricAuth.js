import * as LocalAuthentication from 'expo-local-authentication'

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
    disableDeviceFallback: false,
  })
  return result.success
}
