import { useEffect, useState } from 'react'
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { stockService } from '../../services/stockService'
import { productService } from '../../services/productService'
import SearchableSelectModal from '../../components/ui/SearchableSelectModal'
import PickerField from '../../components/ui/PickerField'
import MoneyField from '../../components/ui/MoneyField'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

export default function StockImportFormScreen({ navigation, route }) {
  const transactionId = route.params?.transactionId
  const isEdit = !!transactionId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState([])
  const [productPickerOpen, setProductPickerOpen] = useState(false)

  const [productId, setProductId] = useState('')
  const [productLabel, setProductLabel] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('0')
  const [note, setNote] = useState('')

  useEffect(() => {
    productService.getAll()
      .then(setProducts)
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được danh sách sản phẩm' }))

    if (isEdit) {
      stockService.getAll()
        .then((all) => {
          const t = all.find((x) => String(x.id) === String(transactionId))
          if (t) {
            setProductId(String(t.productId))
            setProductLabel(t.productName)
            setQuantity(String(t.quantity))
            setUnitPrice(String(t.unitPrice))
            setNote(t.note || '')
          }
        })
        .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được phiếu' }))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [transactionId, isEdit])

  const productOptions = products.map((p) => ({ value: String(p.id), label: `${p.productCode} - ${p.productName}` }))

  const handleSelectProduct = (option) => {
    setProductId(option.value)
    setProductLabel(option.label)
    const product = products.find((p) => String(p.id) === option.value)
    if (product) setUnitPrice(String(product.price))
  }

  const handleSave = async () => {
    if (!productId) {
      Toast.show({ type: 'error', text1: 'Vui lòng chọn sản phẩm' })
      return
    }
    if (!quantity || Number(quantity) <= 0) {
      Toast.show({ type: 'error', text1: 'Số lượng phải lớn hơn 0' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        type: 'Import',
        productId: Number(productId),
        quantity: Number(quantity),
        unitPrice: Number(unitPrice) || 0,
        note: note || null,
      }
      if (isEdit) {
        await stockService.update(transactionId, payload)
        Toast.show({ type: 'success', text1: 'Cập nhật phiếu nhập kho thành công!' })
      } else {
        await stockService.create(payload)
        Toast.show({ type: 'success', text1: 'Nhập kho thành công!' })
      }
      navigation.goBack()
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message || 'Có lỗi xảy ra' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator color={admin.primary} />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{isEdit ? 'Sửa phiếu nhập kho' : 'Tạo phiếu nhập kho'}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Sản phẩm</Text>
            <PickerField label={productLabel} placeholder="-- Chọn sản phẩm --" onPress={() => setProductPickerOpen(true)} />
          </View>

          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Số lượng</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Đơn giá</Text>
              <MoneyField value={unitPrice} onChangeValue={setUnitPrice} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Ghi chú</Text>
            <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="Nhà cung cấp..." placeholderTextColor={admin.textMuted} />
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Đang xử lý...' : isEdit ? 'Lưu thay đổi' : 'Xác nhận nhập kho'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <SearchableSelectModal
          visible={productPickerOpen}
          onClose={() => setProductPickerOpen(false)}
          onSelect={handleSelectProduct}
          options={productOptions}
          title="Chọn sản phẩm"
          searchPlaceholder="Tìm theo tên hoặc mã..."
        />
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: admin.bg },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: admin.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: admin.divider,
    backgroundColor: admin.bg,
  },
  headerTitle: { fontFamily: fonts.adminDisplayBold, fontSize: 16, color: admin.text },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 6 },
  fieldLabel: { fontFamily: fonts.adminBodySemiBold, fontSize: 12, color: admin.text },
  input: {
    height: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: admin.border,
    borderRadius: 8, backgroundColor: admin.card, fontSize: 13, color: admin.text, fontFamily: fonts.adminBody,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn: {
    flex: 1, height: 44, borderWidth: 1, borderColor: admin.border,
    backgroundColor: admin.card, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: admin.text },
  saveBtn: { flex: 1, height: 44, backgroundColor: admin.primary, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: fonts.adminBodyBold, fontSize: 13, color: admin.white },
})
