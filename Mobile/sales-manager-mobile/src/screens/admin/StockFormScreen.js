import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import Toast from 'react-native-toast-message'
import { salesInvoiceService } from '../../services/salesInvoiceService'
import { customerService } from '../../services/customerService'
import { productService } from '../../services/productService'
import { useAuth } from '../../context/auth-context'
import SearchableSelectModal from '../../components/ui/SearchableSelectModal'
import PickerField from '../../components/ui/PickerField'
import MoneyField from '../../components/ui/MoneyField'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

function formatVnd(value) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

function formatDDMMYYYY(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

function formatYYYYMMDD(date) {
  if (!date) return ''
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${year}-${month}-${day}`
}

const emptyItem = () => ({ key: Math.random().toString(36).slice(2), productId: '', quantity: '1', unitPrice: 0 })

export default function StockFormScreen({ navigation, route }) {
  const { user } = useAuth()
  const invoiceId = route.params?.invoiceId
  const isEdit = !!invoiceId

  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date())
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [items, setItems] = useState([emptyItem()])

  const [customerPickerOpen, setCustomerPickerOpen] = useState(false)
  const [productPickerKey, setProductPickerKey] = useState(null)

  useEffect(() => {
    Promise.all([
      customerService.getAll(),
      productService.getAll(),
      isEdit ? salesInvoiceService.getById(invoiceId) : Promise.resolve(null),
    ])
      .then(([customerList, productList, invoice]) => {
        setCustomers(customerList)
        setProducts(productList)
        if (invoice) {
          setCustomerId(String(invoice.customerId))
          setCustomerName(invoice.customerName || '')
          setInvoiceDate(invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date())
          setItems(
            invoice.items?.length
              ? invoice.items.map((it) => ({
                  key: Math.random().toString(36).slice(2),
                  productId: String(it.productId),
                  quantity: String(it.quantity),
                  unitPrice: it.unitPrice,
                }))
              : [emptyItem()]
          )
        }
      })
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được dữ liệu' }))
      .finally(() => setLoading(false))
  }, [invoiceId, isEdit])

  const productById = (id) => products.find((p) => String(p.id) === String(id))

  const updateItem = (key, patch) => {
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  }

  const selectProductForLine = (key, option) => {
    const product = productById(option.value)
    updateItem(key, { productId: option.value, unitPrice: product?.price ?? 0 })
  }

  const addRow = () => setItems((list) => [...list, emptyItem()])
  const removeRow = (key) => setItems((list) => (list.length > 1 ? list.filter((it) => it.key !== key) : list))

  const grandTotal = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0),
    [items]
  )

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false)
    }
    if (selectedDate) {
      setInvoiceDate(selectedDate)
    }
  }

  const handleSave = async () => {
    if (!customerId) {
      Toast.show({ type: 'error', text1: 'Vui lòng chọn khách hàng' })
      return
    }
    const validItems = items.filter((it) => it.productId && Number(it.quantity) > 0)
    if (validItems.length === 0) {
      Toast.show({ type: 'error', text1: 'Vui lòng thêm ít nhất 1 sản phẩm' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        customerId: Number(customerId),
        invoiceDate: formatYYYYMMDD(invoiceDate),
        preparedByName: user?.fullName || user?.username || '',
        items: validItems.map((it) => ({
          productId: Number(it.productId),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      }
      if (isEdit) {
        await salesInvoiceService.update(invoiceId, payload)
        Toast.show({ type: 'success', text1: 'Cập nhật phiếu bán hàng thành công!' })
      } else {
        await salesInvoiceService.create(payload)
        Toast.show({ type: 'success', text1: 'Tạo phiếu bán hàng thành công!' })
      }
      navigation.goBack()
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message || 'Có lỗi xảy ra' })
    } finally {
      setSaving(false)
    }
  }

  const customerOptions = customers.map((c) => ({ value: String(c.id), label: c.fullName }))
  const productOptions = products.map((p) => ({ value: String(p.id), label: `${p.productCode} - ${p.productName}` }))

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
          <Text style={styles.headerTitle}>{isEdit ? 'Sửa phiếu bán hàng' : 'Tạo phiếu bán hàng'}</Text>
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Khách hàng</Text>
          <PickerField
            label={customerName}
            placeholder="-- Chọn khách hàng --"
            onPress={() => setCustomerPickerOpen(true)}
          />
        </View>

        {/* ── Ô chọn ngày tháng dạng DD-MM-YYYY ── */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ngày xuất phiếu</Text>
          <TouchableOpacity
            style={styles.datePickerBtn}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.datePickerText}>📅  {formatDDMMYYYY(invoiceDate)}</Text>
            <Text style={styles.datePickerChevron}>▼</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.itemsSection}>
          {items.map((it) => {
            const product = productById(it.productId)
            const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
            return (
              <View key={it.key} style={styles.itemCard}>
                <PickerField
                  label={product ? `${product.productCode} - ${product.productName}` : ''}
                  placeholder="-- Chọn sản phẩm --"
                  onPress={() => setProductPickerKey(it.key)}
                  style={styles.itemProductField}
                />
                <View style={styles.itemRow}>
                  <View style={styles.qtyField}>
                    <Text style={styles.smallLabel}>SL</Text>
                    <TextInput
                      style={styles.qtyInput}
                      keyboardType="numeric"
                      value={it.quantity}
                      onChangeText={(v) => updateItem(it.key, { quantity: v })}
                    />
                  </View>
                  <View style={styles.priceField}>
                    <Text style={styles.smallLabel}>Đơn giá</Text>
                    <MoneyField
                      value={it.unitPrice}
                      onChangeValue={(v) => updateItem(it.key, { unitPrice: v })}
                    />
                  </View>
                  <TouchableOpacity onPress={() => removeRow(it.key)} disabled={items.length === 1} style={styles.removeBtn}>
                    <Text style={[styles.removeBtnText, items.length === 1 && styles.removeBtnDisabled]}>Xóa</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.itemLineTotal}>{formatVnd(lineTotal)}đ</Text>
              </View>
            )
          })}
          <TouchableOpacity style={styles.addLineBtn} onPress={addRow}>
            <Text style={styles.addLineText}>+ Thêm dòng</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatVnd(grandTotal)}đ</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelBtnText}>Hủy</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu phiếu'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Native Date Picker (Android / iOS) ── */}
      {Platform.OS === 'android' && showDatePicker && (
        <DateTimePicker
          value={invoiceDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showDatePicker} transparent animationType="slide">
          <TouchableOpacity style={styles.iosModalOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
            <View style={styles.iosModalContent}>
              <View style={styles.iosModalHeader}>
                <Text style={styles.iosModalTitle}>Chọn ngày xuất phiếu</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.iosDoneText}>Xong</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={invoiceDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                locale="vi-VN"
                style={styles.iosPicker}
              />
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      <SearchableSelectModal
        visible={customerPickerOpen}
        onClose={() => setCustomerPickerOpen(false)}
        onSelect={(option) => { setCustomerId(option.value); setCustomerName(option.label) }}
        options={customerOptions}
        title="Chọn khách hàng"
        searchPlaceholder="Tìm theo tên khách hàng..."
      />
      <SearchableSelectModal
        visible={!!productPickerKey}
        onClose={() => setProductPickerKey(null)}
        onSelect={(option) => selectProductForLine(productPickerKey, option)}
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
  field: { gap: 6 },
  fieldLabel: { fontFamily: fonts.adminBodySemiBold, fontSize: 12, color: admin.text },
  datePickerBtn: {
    height: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: admin.border,
    borderRadius: 8, backgroundColor: admin.card, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  datePickerText: { fontFamily: fonts.adminBodySemiBold, fontSize: 13.5, color: admin.text },
  datePickerChevron: { fontSize: 10, color: admin.textMuted },
  itemsSection: { gap: 10, borderTopWidth: 1, borderTopColor: admin.divider, paddingTop: 12 },
  itemCard: { backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderRadius: 10, padding: 11, gap: 8 },
  itemProductField: { backgroundColor: admin.white },
  itemRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  qtyField: { width: 70, gap: 4 },
  priceField: { flex: 1, gap: 4 },
  smallLabel: { fontFamily: fonts.adminBody, fontSize: 11, color: admin.textMuted },
  qtyInput: {
    height: 44, borderWidth: 1, borderColor: admin.border, borderRadius: 8, paddingHorizontal: 10,
    fontSize: 13, color: admin.text, backgroundColor: admin.white, fontFamily: fonts.adminBody,
  },
  removeBtn: { height: 44, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  removeBtnText: { color: admin.dangerText, fontFamily: fonts.adminBodySemiBold, fontSize: 12 },
  removeBtnDisabled: { opacity: 0.4 },
  itemLineTotal: { textAlign: 'right', fontFamily: fonts.adminDisplayBold, fontSize: 13.5, color: admin.text },
  addLineBtn: {
    height: 44, borderWidth: 1, borderStyle: 'dashed', borderColor: admin.border,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  addLineText: { color: admin.primary, fontFamily: fonts.adminBodySemiBold, fontSize: 12.5 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    borderTopWidth: 1, borderTopColor: admin.border, borderStyle: 'dashed', paddingTop: 12,
  },
  totalLabel: { fontFamily: fonts.adminBody, fontSize: 13, color: admin.textMuted },
  totalValue: { fontFamily: fonts.adminDisplayBold, fontSize: 19, color: admin.text },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn: {
    flex: 1, height: 44, borderWidth: 1, borderColor: admin.border,
    backgroundColor: admin.card, borderRadius: 9, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: admin.text },
  saveBtn: { flex: 1, height: 44, backgroundColor: admin.primary, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontFamily: fonts.adminBodyBold, fontSize: 13, color: admin.white },

  // iOS Picker Modal
  iosModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  iosModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 20 },
  iosModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  iosModalTitle: { fontFamily: fonts.adminDisplayBold, fontSize: 15, color: admin.text },
  iosDoneText: { fontFamily: fonts.adminBodyBold, fontSize: 14, color: admin.primary },
  iosPicker: { height: 200 },
})
