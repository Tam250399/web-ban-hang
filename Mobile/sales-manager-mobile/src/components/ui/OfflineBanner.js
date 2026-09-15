import { StyleSheet, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNetwork } from '../../context/network-context'
import { brand } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

export default function OfflineBanner() {
  const { isOnline } = useNetwork()

  if (isOnline) return null

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <Text style={styles.text}>Mất kết nối mạng — đang hiển thị dữ liệu đã lưu trên máy</Text>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { backgroundColor: brand.danger, zIndex: 999 },
  text: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
})
