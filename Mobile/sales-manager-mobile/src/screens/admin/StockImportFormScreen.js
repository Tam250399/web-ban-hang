import { useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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
    <View style={styles.root}>
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>{isEdit ? 'Sửa phiếu nhập kho' : 'Tạo phiếu nhập kho'}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerAccent} />
        </View>
      </SafeAreaView>

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
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: admin.bg },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: admin.bg },
  headerSafeArea: { backgroundColor: admin.dark },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, position: 'relative' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { color: '#F5F2EA', fontFamily: fonts.adminDisplayBold, fontSize: 17 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#F5F2EA', fontSize: 13 },
  headerAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: admin.primary },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 14, paddingBottom: 32 },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 6 },
  fieldLabel: { fontFamily: fonts.adminBodySemiBold, fontSize: 11.5, color: admin.text },
  input: {
    paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: admin.border,
    borderRadius: 8, backgroundColor: admin.card, fontSize: 13, color: admin.text, fontFamily: fonts.adminBody,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: admin.border,
    backgroundColor: admin.card, borderRadius: 9, alignItems: 'center',
  },
  cancelBtnText: { fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: admin.text },
  saveBtn: { flex: 1, paddingVertical: 12, backgroundColor: admin.primary, borderRadius: 9, alignItems: 'center' },
  saveBtnText: { fontFamily: fonts.adminBodyBold, fontSize: 13, color: admin.white },
})
