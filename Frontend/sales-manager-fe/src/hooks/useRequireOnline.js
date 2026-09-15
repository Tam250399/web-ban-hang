import { useCallback } from 'react'
import toast from 'react-hot-toast'
import { useNetwork } from '../context/network-context'

export function useRequireOnline() {
  const { isOnline } = useNetwork()

  return useCallback((action = 'Thao tác này') => {
    if (isOnline) return true
    toast.error(`${action} cần có mạng. Vui lòng thử lại khi đã kết nối.`)
    return false
  }, [isOnline])
}
