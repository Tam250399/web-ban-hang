import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { stockService } from '../../services/stockService'
import { useRequireOnline } from '../../hooks/useRequireOnline'
import { productService } from '../../services/productService'
import DropdownSelect from '../../components/ui/DropdownSelect'
import MoneyField from '../../components/ui/MoneyField'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'
import { Icon, ICON_ROW } from '../../components/ui/Icon'

/**
 * Màn hình lập phiếu nhập kho sản phẩm
 */
export default function StockImportFormScreen({ navigation, route }) {
  const transactionId = route.params?.transactionId
  const isEdit = !!transactionId
  const requireOnline = useRequireOnline()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [products, setProducts] = useState([])

  const [productId, setProductId] = useState('')
  const [productLabel, setProductLabel] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('0')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [dirty, setDirty] = useState(false)

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

  const handleExit = () => {
    if (!dirty) {
      navigation.goBack()
      return
    }
    Alert.alert('Thoát mà không lưu?', 'Những thông tin bạn vừa nhập sẽ bị mất.', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Thoát', style: 'destructive', onPress: () => navigation.goBack() },
    ])
  }

  const handleSelectProduct = (option) => {
    setDirty(true)
    setProductId(option.value)
    setProductLabel(option.label)
    setErrors((prev) => {
      const next = { ...prev }
      delete next.productId
      return next
    })
    const product = products.find((p) => String(p.id) === option.value)
    if (product) setUnitPrice(String(product.price))
  }

  const validateForm = () => {
    const errs = {}
    if (!productId) {
      errs.productId = 'Vui lòng chọn sản phẩm'
    }
    if (!quantity || Number(quantity) <= 0 || isNaN(Number(quantity))) {
      errs.quantity = 'Số lượng phải > 0'
    }
    if (unitPrice === '' || Number(unitPrice) < 0 || isNaN(Number(unitPrice))) {
      errs.unitPrice = 'Đơn giá không hợp lệ'
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    setSubmitted(true)
    if (!validateForm()) {
      Toast.show({
        type: 'error',
        text1: 'Chưa đủ thông tin',
        text2: 'Vui lòng điền đầy đủ các thông tin báo đỏ (*)',
        visibilityTime: 4000,
      })
      return
    }
    if (!requireOnline('Lưu phiếu nhập kho')) return

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
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{isEdit ? 'Sửa phiếu nhập kho' : 'Tạo phiếu nhập kho'}</Text>
        <TouchableOpacity style={styles.closeBtn} onPress={handleExit} activeOpacity={0.7} hitSlop={8} accessibilityLabel="Đóng">
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Sản phẩm <Text style={styles.requiredStar}>*</Text></Text>
          <DropdownSelect
            value={productId}
            label={productLabel}
            placeholder="-- Chọn sản phẩm --"
            options={productOptions}
            onSelect={handleSelectProduct}
            title="Chọn sản phẩm"
            searchPlaceholder="Tìm theo tên hoặc mã sản phẩm..."
            error={!!errors.productId}
            errorText={errors.productId}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Số lượng <Text style={styles.requiredStar}>*</Text></Text>
            <TextInput
              style={[styles.input, errors.quantity && styles.inputError]}
              keyboardType="numeric"
              value={quantity}
              onChangeText={(v) => {
                setDirty(true)
                setQuantity(v)
                if (errors.quantity) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.quantity
                    return next
                  })
                }
              }}
            />
            {!!errors.quantity && (
              <View style={ICON_ROW}>
                <Icon name="alert" size={13} color={admin.dangerText} />
                <Text style={styles.inlineError}>{errors.quantity}</Text>
              </View>
            )}
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Đơn giá</Text>
            <MoneyField
              value={unitPrice}
              onChangeValue={(v) => {
                setDirty(true)
                setUnitPrice(v)
                if (errors.unitPrice) {
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.unitPrice
                    return next
                  })
                }
              }}
              style={errors.unitPrice && styles.inputError}
            />
            {!!errors.unitPrice && (
              <View style={ICON_ROW}>
                <Icon name="alert" size={13} color={admin.dangerText} />
                <Text style={styles.inlineError}>{errors.unitPrice}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ghi chú</Text>
          <TextInput
            style={styles.input}
            value={note}
            onChangeText={(v) => { setDirty(true); setNote(v) }}
            placeholder="Nhà cung cấp, ghi chú..."
            placeholderTextColor={admin.textMuted}
          />
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={handleExit}>
            <Text style={styles.cancelBtnText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Đang xử lý...' : isEdit ? 'Lưu thay đổi' : 'Xác nhận nhập kho'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: admin.bg },
  flex: { flex: 1 },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: admin.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: admin.divider,
    backgroundColor: admin.bg,
  },
  headerTitle: { fontFamily: fonts.adminDisplayBold, fontSize: 17, color: admin.text },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 14, paddingBottom: 40 },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorBannerIcon: { fontSize: 17 },
  errorBannerText: { flex: 1, color: '#B91C1C', fontFamily: fonts.adminBodyBold, fontSize: 13 },
  row: { flexDirection: 'row', gap: 12 },
  field: { flex: 1, gap: 6 },
  fieldLabel: { fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: admin.text },
  requiredStar: { color: '#EF4444' },
  input: {
    height: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: admin.border,
    borderRadius: 8, backgroundColor: admin.card, fontSize: 14, color: admin.text, fontFamily: fonts.adminBody,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  inlineError: {
    color: '#EF4444',
    fontFamily: fonts.adminBodyBold,
    fontSize: 12.5,
    marginTop: 2,
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn: {
    flex: 1, height: 44, borderWidth: 1, borderColor: admin.border,
    backgroundColor: admin.card, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: fonts.adminBodySemiBold, fontSize: 14, color: admin.text },
  saveBtn: { flex: 1, height: 44, backgroundColor: admin.primary, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: fonts.adminBodyBold, fontSize: 14, color: admin.white },
})
