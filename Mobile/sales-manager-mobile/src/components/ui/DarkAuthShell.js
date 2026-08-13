import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import HazardStripe from './HazardStripe'

// Khung chung cho Login/Register với nền F1F5F9 đậm hơn 1 tông để nổi bật Card trắng
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
  shell: { flex: 1, backgroundColor: '#E2E8F0' }, // Đậm hơn 1 tông (Slate 200) làm nổi bật card trắng
  flex: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20 },
})
