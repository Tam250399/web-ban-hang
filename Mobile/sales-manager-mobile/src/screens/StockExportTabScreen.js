import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import StockExportPanel from '../components/admin/StockExportPanel'
import { admin } from '../theme/colors'

// Phiên bản của tab "Sản phẩm" dành cho Admin: thay vì duyệt sản phẩm như khách
// hàng, admin vào thẳng quản lý xuất kho.
export default function StockExportTabScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <StockExportPanel />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: admin.bg },
})
