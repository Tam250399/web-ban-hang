import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../context/auth-context'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'

export default function AccountScreen({ navigation }) {
  const { user, isGuest, logout } = useAuth()

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <Text style={styles.hint}>Đăng nhập để xem thông tin tài khoản</Text>
        <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginBtnText}>Đăng nhập</Text>
        </TouchableOpacity>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.name}>{user.fullName}</Text>
      <Text style={styles.username}>@{user.username}</Text>

      {user.role !== 'Admin' && (
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('MyOrders')}>
          <Text style={styles.rowText}>Đơn hàng của tôi</Text>
        </TouchableOpacity>
      )}
      {user.role === 'Admin' && (
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Admin')}>
          <Text style={styles.rowText}>Quản trị</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.row} onPress={logout}>
        <Text style={[styles.rowText, styles.logoutText]}>Đăng xuất</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: brand.bg, padding: 20 },
  hint: { color: brand.textMuted, fontFamily: fonts.body, fontSize: 14, marginBottom: 16, textAlign: 'center' },
  loginBtn: { backgroundColor: brand.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  loginBtnText: { color: brand.white, fontFamily: fonts.displayExtraBold, fontSize: 15 },
  name: { fontFamily: fonts.displayExtraBold, fontSize: 22, color: brand.ink },
  username: { fontFamily: fonts.mono, fontSize: 12, color: brand.textMuted, marginTop: 2, marginBottom: 20 },
  row: {
    backgroundColor: brand.white, borderWidth: 1.5, borderColor: brand.ink,
    borderRadius: 10, padding: 14, marginBottom: 10,
  },
  rowText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: brand.ink },
  logoutText: { color: brand.danger },
})
