import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import HazardStripe from './HazardStripe'
import { brand } from '../../theme/colors'

// Khung chung cho Login/Register: nền tối, sọc chéo vàng/đen, nội dung cuộn được
// và tự tránh bàn phím — tương ứng .auth-shell + .hzd bên web.
export default function DarkAuthShell({ children }) {
  return (
    <SafeAreaView style={styles.shell} edges={['top', 'bottom']}>
      <HazardStripe />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  shell: { flex: 1, backgroundColor: brand.ink },
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 22 },
})
