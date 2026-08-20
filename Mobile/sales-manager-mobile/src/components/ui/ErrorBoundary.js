import { Component } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { brand } from '../../theme/colors'

// Không có ranh giới lỗi thì một exception khi render ở bất kỳ màn nào cũng làm
// trắng màn hình và người dùng chỉ còn cách tắt hẳn app. Ở đây bắt lỗi lại,
// hiện thông báo tiếng Việt và cho bấm "Thử lại" để render lại cây component.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    // Chưa gắn dịch vụ báo lỗi từ xa (Sentry/Bugsnag) — tạm ghi ra log để còn
    // đọc được trong `npx expo start` hoặc logcat khi user báo sự cố.
    console.error('[ErrorBoundary]', error, info?.componentStack)
  }

  handleRetry = () => this.setState({ error: null })

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Ứng dụng gặp sự cố</Text>
          <Text style={styles.message}>
            Đã có lỗi ngoài dự kiến. Bạn có thể thử lại — dữ liệu đã lưu trên máy chủ không bị ảnh hưởng.
          </Text>

          {__DEV__ && (
            <View style={styles.devBox}>
              <Text style={styles.devText}>{String(error?.message || error)}</Text>
            </View>
          )}

          <TouchableOpacity style={styles.retryBtn} onPress={this.handleRetry} activeOpacity={0.85}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    )
  }
}

// Cố tình KHÔNG dùng font tuỳ biến ở màn này: lỗi có thể xảy ra trước khi
// useAppFonts() nạp xong, mà fontFamily chưa đăng ký sẽ làm iOS crash tiếp —
// đúng lúc cần một màn hình luôn hiện được thì lại hỏng.
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 },
  icon: { fontSize: 44 },
  title: { fontSize: 22, fontWeight: '800', color: '#0F172A', textAlign: 'center' },
  message: {
    fontSize: 15, lineHeight: 21,
    color: '#475569', textAlign: 'center', marginBottom: 8,
  },
  devBox: {
    width: '100%', backgroundColor: '#1E293B', borderRadius: 10,
    padding: 12, marginBottom: 8,
  },
  devText: { fontSize: 12.5, color: '#FCA5A5' },
  retryBtn: {
    backgroundColor: brand.primary, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 40,
  },
  retryText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
})
