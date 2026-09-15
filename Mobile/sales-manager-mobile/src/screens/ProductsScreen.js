import { ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import ProductCatalog from '../components/home/ProductCatalog'
import { brand } from '../theme/colors'

/**
 * Màn hình danh mục toàn bộ sản phẩm trên di động
 */
export default function ProductsScreen() {
  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ProductCatalog />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brand.bg },
  scrollContent: { paddingBottom: 24 },
})
