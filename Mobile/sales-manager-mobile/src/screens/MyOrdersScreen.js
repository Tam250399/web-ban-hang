import { StyleSheet, Text, View } from 'react-native'

// Placeholder: sẽ được xây dựng theo thiết kế thật (tương ứng MyOrders.jsx bên web),
// dùng orderService một khi service này được thêm vào mobile.
export default function MyOrdersScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đơn hàng của tôi</Text>
      <Text style={styles.hint}>Chờ thiết kế để triển khai danh sách đơn hàng.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  title: { fontSize: 20, fontWeight: '700' },
  hint: { marginTop: 8, color: '#777', fontSize: 13 },
})
