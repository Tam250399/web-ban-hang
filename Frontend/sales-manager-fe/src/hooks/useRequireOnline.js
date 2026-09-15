import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { useNetwork } from '../context/network-context'

/**
 * Hook kiểm tra kết nối mạng trước khi thực hiện các hành động cần gọi API trực tiếp
 */
export function useRequireOnline() {
  const { isOnline } = useNetwork()

  return useCallback((action = 'Thao tác này') => {
    if (isOnline) return true
    toast.error(`${action} cần có mạng. Vui lòng thử lại khi đã kết nối.`)
    return false
  }, [isOnline])
}
