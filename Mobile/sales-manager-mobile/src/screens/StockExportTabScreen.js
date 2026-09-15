import { StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import StockExportPanel from '../components/admin/StockExportPanel'
import { admin } from '../theme/colors'

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
