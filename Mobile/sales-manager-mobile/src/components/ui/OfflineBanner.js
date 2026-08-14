import { useEffect, useState } from 'react'
import { StyleSheet, Text } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import { SafeAreaView } from 'react-native-safe-area-context'
import { brand } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

// Banner cố định trên cùng toàn app khi mất mạng — NetInfo báo cả trạng thái
// "có kết nối nhưng không có Internet" (isInternetReachable === false), vì
// vậy chỉ coi là offline khi isConnected/isInternetReachable rõ ràng là false.
export default function OfflineBanner() {
  const [offline, setOffline] = useState(false)

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false || state.isInternetReachable === false)
    })
    return unsubscribe
  }, [])

  if (!offline) return null

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <Text style={styles.text}>📡 Mất kết nối mạng — một số tính năng có thể không hoạt động</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { backgroundColor: brand.danger, zIndex: 999 },
  text: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    textAlign: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
})
