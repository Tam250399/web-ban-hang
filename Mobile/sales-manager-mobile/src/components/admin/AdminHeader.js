import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

export default function AdminHeader() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>VL</Text>
        </View>
        <View style={styles.titles}>
          <Text style={styles.title} numberOfLines={1}>Admin Dashboard</Text>
          <Text style={styles.subtitle} numberOfLines={1}>Vật Liệu Xây Dựng</Text>
        </View>
        <Text style={styles.bell}>🔔</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: admin.dark },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 36, height: 36, borderRadius: 8, backgroundColor: admin.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: admin.white, fontFamily: fonts.adminDisplayBold, fontSize: 14 },
  titles: { flex: 1, minWidth: 0 },
  title: { color: '#F5F2EA', fontFamily: fonts.adminDisplayBold, fontSize: 14.5 },
  subtitle: { color: admin.primary, fontFamily: fonts.adminDisplay, fontSize: 12, marginTop: 1 },
  bell: { fontSize: 18 },
})
