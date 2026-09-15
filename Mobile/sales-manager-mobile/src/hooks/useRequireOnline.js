import { useCallback } from 'react'
import Toast from 'react-native-toast-message'
import { useNetwork } from '../context/network-context'

/**
 * Hook cảnh báo và ngăn chặn thao tác khi thiết bị mất kết nối mạng internet (Mobile)
 */
export function useRequireOnline() {
  const { isOnline } = useNetwork()

  return useCallback((action = 'Thao tác này') => {
    if (isOnline) return true
    Toast.show({
      type: 'error',
      text1: 'Không có kết nối mạng',
      text2: `${action} cần có mạng. Vui lòng thử lại khi đã kết nối.`,
    })
    return false
  }, [isOnline])
}
