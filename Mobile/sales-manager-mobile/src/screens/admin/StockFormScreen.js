import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
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

const today = () => new Date().toISOString().slice(0, 10)
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
  const [invoiceDate, setInvoiceDate] = useState(today())
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
          setInvoiceDate(invoice.invoiceDate?.slice(0, 10) || today())
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
        invoiceDate,
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
    <View style={styles.root}>
      <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.header}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Đức Lợi</Text>
          </View>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>{isEdit ? 'Sửa phiếu bán hàng' : 'Phiếu bán hàng'}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.headerAccent} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Khách hàng</Text>
          <PickerField
            label={customerName}
            placeholder="-- Chọn khách hàng --"
            onPress={() => setCustomerPickerOpen(true)}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Ngày (YYYY-MM-DD)</Text>
          <TextInput style={styles.dateInput} value={invoiceDate} onChangeText={setInvoiceDate} placeholder="2026-08-13" placeholderTextColor={admin.textMuted} />
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
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: admin.bg },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: admin.bg },
  headerSafeArea: { backgroundColor: admin.dark },
  header: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 16, position: 'relative' },
  tag: {
    alignSelf: 'flex-start', backgroundColor: admin.primary, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 8, transform: [{ rotate: '-2deg' }],
  },
  tagText: { color: admin.white, fontFamily: fonts.adminDisplay, fontSize: 9.5 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  headerTitle: { color: '#F5F2EA', fontFamily: fonts.adminDisplayBold, fontSize: 19 },
  closeBtn: {
    width: 28, height: 28, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { color: '#F5F2EA', fontSize: 13 },
  headerAccent: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: admin.primary },
  body: { flex: 1 },
  bodyContent: { padding: 16, gap: 14, paddingBottom: 32 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fonts.adminBodySemiBold, fontSize: 11.5, color: admin.text },
  dateInput: {
    paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: admin.border,
    borderRadius: 8, backgroundColor: admin.card, fontSize: 13, color: admin.text, fontFamily: fonts.adminBody,
  },
  itemsSection: { gap: 10, borderTopWidth: 1, borderTopColor: admin.divider, paddingTop: 12 },
  itemCard: { backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderRadius: 10, padding: 11, gap: 8 },
  itemProductField: { backgroundColor: admin.white },
  itemRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end' },
  qtyField: { width: 70, gap: 4 },
  priceField: { flex: 1, gap: 4 },
  smallLabel: { fontFamily: fonts.adminBody, fontSize: 10.5, color: admin.textMuted },
  qtyInput: {
    borderWidth: 1, borderColor: admin.border, borderRadius: 7, paddingHorizontal: 8, paddingVertical: 7,
    fontSize: 12.5, color: admin.text, backgroundColor: admin.white, fontFamily: fonts.adminBody,
  },
  removeBtn: { paddingVertical: 8, paddingHorizontal: 6 },
  removeBtnText: { color: admin.dangerText, fontFamily: fonts.adminBodySemiBold, fontSize: 11.5 },
  removeBtnDisabled: { opacity: 0.4 },
  itemLineTotal: { textAlign: 'right', fontFamily: fonts.adminDisplayBold, fontSize: 13, color: admin.text },
  addLineBtn: {
    paddingVertical: 9, borderWidth: 1, borderStyle: 'dashed', borderColor: admin.border,
    borderRadius: 8, alignItems: 'center',
  },
  addLineText: { color: admin.primary, fontFamily: fonts.adminBodySemiBold, fontSize: 12 },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    borderTopWidth: 1, borderTopColor: admin.border, borderStyle: 'dashed', paddingTop: 12,
  },
  totalLabel: { fontFamily: fonts.adminBody, fontSize: 12.5, color: admin.textMuted },
  totalValue: { fontFamily: fonts.adminDisplayBold, fontSize: 19, color: admin.text },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn: {
    flex: 1, paddingVertical: 12, borderWidth: 1, borderColor: admin.border,
    backgroundColor: admin.card, borderRadius: 9, alignItems: 'center',
  },
  cancelBtnText: { fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: admin.text },
  saveBtn: { flex: 1, paddingVertical: 12, backgroundColor: admin.primary, borderRadius: 9, alignItems: 'center' },
  saveBtnText: { fontFamily: fonts.adminBodyBold, fontSize: 13, color: admin.white },
})
