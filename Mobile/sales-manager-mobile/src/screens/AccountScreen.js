import { StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../context/auth-context'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'

export default function AccountScreen({ navigation }) {
  const {
    user, isGuest, logout,
    biometricSupported, biometricLabel, biometricEnabled,
    enableBiometricLogin, disableBiometricLogin,
  } = useAuth()

  const handleToggleBiometric = async (value) => {
    if (value) await enableBiometricLogin()
    else await disableBiometricLogin()
  }

  if (isGuest) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.guestCard}>
          <Text style={styles.guestIcon}>👤</Text>
          <Text style={styles.guestTitle}>Tài khoản</Text>
          <Text style={styles.hint}>Vui lòng đăng nhập để xem thông tin và quản lý tài khoản của bạn.</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Login')} activeOpacity={0.85}>
            <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* ── User profile card ── */}
      <View style={styles.profileCard}>
        <LinearGradient colors={['#EA580C', '#F97316']} style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user.fullName || user.username || 'U').charAt(0).toUpperCase()}
          </Text>
        </LinearGradient>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>{user.fullName}</Text>
          <Text style={styles.username}>@{user.username} • {user.role === 'Admin' ? 'Quản trị viên' : 'Khách hàng'}</Text>
        </View>
      </View>

      <View style={styles.menuSection}>
        {user.role !== 'Admin' && (
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Orders')} activeOpacity={0.7}>
            <Text style={styles.rowIcon}>📋</Text>
            <Text style={styles.rowText}>Đơn hàng của tôi</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
        )}
        {user.role === 'Admin' && (
          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Admin')} activeOpacity={0.7}>
            <Text style={styles.rowIcon}>⚙️</Text>
            <Text style={styles.rowText}>Quản trị hệ thống</Text>
            <Text style={styles.rowChevron}>›</Text>
          </TouchableOpacity>
        )}
        {biometricSupported && (
          <View style={styles.row}>
            <Text style={styles.rowIcon}>{biometricLabel === 'Face ID' ? '🙂' : '👆'}</Text>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowText}>Khoá ứng dụng bằng {biometricLabel}</Text>
              <Text style={styles.rowHint}>
                Mỗi lần mở lại ứng dụng sẽ phải xác thực mới xem được nội dung.
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={handleToggleBiometric}
              trackColor={{ false: '#E2E8F0', true: brand.primary }}
            />
          </View>
        )}
        <TouchableOpacity style={[styles.row, styles.logoutRow]} onPress={logout} activeOpacity={0.7}>
          <Text style={styles.rowIcon}>🚪</Text>
          <Text style={[styles.rowText, styles.logoutText]}>Đăng xuất</Text>
          <Text style={styles.rowChevron}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  guestCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center',
    borderWidth: 1, borderColor: '#E2E8F0', marginTop: 40,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2,
  },
  guestIcon: { fontSize: 48, marginBottom: 12 },
  guestTitle: { fontFamily: fonts.displayExtraBold, fontSize: 20, color: '#0F172A', marginBottom: 6 },
  hint: { color: brand.textMuted, fontFamily: fonts.body, fontSize: 14.5, marginBottom: 20, textAlign: 'center', lineHeight: 20 },
  loginBtn: { backgroundColor: brand.primary, borderRadius: 12, paddingVertical: 13, paddingHorizontal: 32, alignItems: 'center' },
  loginBtnText: { color: brand.white, fontFamily: fonts.displayBold, fontSize: 16 },

  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2,
  },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontFamily: fonts.displayExtraBold, fontSize: 20 },
  profileInfo: { flex: 1 },
  name: { fontFamily: fonts.displayExtraBold, fontSize: 18, color: '#0F172A' },
  username: { fontFamily: fonts.monoBold, fontSize: 13, color: brand.textMuted, marginTop: 2 },

  menuSection: { gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  logoutRow: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  rowIcon: { fontSize: 18 },
  rowTextWrap: { flex: 1, gap: 2 },
  rowText: { fontFamily: fonts.bodyBold, fontSize: 15.5, color: '#0F172A' },
  rowHint: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: '#64748B' },
  rowChevron: { fontSize: 18, color: '#94A3B8', fontFamily: fonts.bodyBold },
  logoutText: { color: '#EF4444' },
})
