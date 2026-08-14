import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import Toast from 'react-native-toast-message'
import { salesInvoiceService } from '../../services/salesInvoiceService'
import { customerService } from '../../services/customerService'
import { productService } from '../../services/productService'
import { useAuth } from '../../context/auth-context'
import DropdownSelect from '../../components/ui/DropdownSelect'
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
  const [errors, setErrors] = useState({})
  const [submitted, setSubmitted] = useState(false)

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
    // Xóa lỗi của dòng này khi người dùng sửa
    if (errors.items?.[key]) {
      setErrors((prev) => {
        const nextItems = { ...prev.items }
        delete nextItems[key]
        return { ...prev, items: nextItems }
      })
    }
  }

  const selectProductForLine = (key, option) => {
    const product = productById(option.value)
    updateItem(key, { productId: option.value, unitPrice: product?.price ?? 0 })
  }

  const addRow = () => {
    setItems((list) => [...list, emptyItem()])
  }

  const removeRow = (key) => {
    setItems((list) => (list.length > 1 ? list.filter((it) => it.key !== key) : list))
    if (errors.items?.[key]) {
      setErrors((prev) => {
        const nextItems = { ...prev.items }
        delete nextItems[key]
        return { ...prev, items: nextItems }
      })
    }
  }

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

  // ── Kiểm tra toàn diện các trường dữ liệu ──
  const validateForm = () => {
    const errs = {}

    if (!customerId) {
      errs.customerId = 'Vui lòng chọn khách hàng'
    }

    if (!items || items.length === 0) {
      errs.general = 'Vui lòng thêm ít nhất 1 mặt hàng'
    } else {
      const itemErrors = {}
      let hasItemError = false

      items.forEach((it, idx) => {
        const rowErr = {}
        if (!it.productId) {
          rowErr.productId = 'Vui lòng chọn sản phẩm'
          hasItemError = true
        }
        if (!it.quantity || Number(it.quantity) <= 0 || isNaN(Number(it.quantity))) {
          rowErr.quantity = 'SL > 0'
          hasItemError = true
        }
        if (it.unitPrice === '' || Number(it.unitPrice) < 0 || isNaN(Number(it.unitPrice))) {
          rowErr.unitPrice = 'Giá >= 0'
          hasItemError = true
        }
        if (Object.keys(rowErr).length > 0) {
          itemErrors[it.key] = rowErr
        }
      })

      if (hasItemError) {
        errs.items = itemErrors
      }
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
        text2: 'Vui lòng kiểm tra lại các mục báo đỏ (*)',
        visibilityTime: 3000,
      })
      return
    }

    setSaving(true)
    try {
      const payload = {
        customerId: Number(customerId),
        invoiceDate: formatYYYYMMDD(invoiceDate),
        preparedByName: user?.fullName || user?.username || '',
        items: items.map((it) => ({
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
          <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()} activeOpacity={0.7} hitSlop={8} accessibilityLabel="Đóng">
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* ── Khối Thông tin phiếu ── */}
          <View style={[styles.sectionCard, errors.customerId && styles.cardErrorBorder]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>📄</Text>
              <Text style={styles.sectionTitle}>THÔNG TIN PHIẾU</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Khách hàng <Text style={styles.requiredStar}>*</Text></Text>
              <DropdownSelect
                value={customerId}
                label={customerName}
                placeholder="-- Chọn khách hàng --"
                options={customerOptions}
                onSelect={(option) => {
                  setCustomerId(option.value)
                  setCustomerName(option.label)
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.customerId
                    return next
                  })
                }}
                title="Chọn khách hàng"
                searchPlaceholder="Tìm theo tên khách hàng..."
                textStyle={styles.boldText}
                error={!!errors.customerId}
                errorText={errors.customerId}
              />
            </View>

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
          </View>

          {/* ── Khối Danh sách sản phẩm ── */}
          <View style={styles.itemsSection}>
            <View style={styles.itemsSectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <Text style={styles.sectionIcon}>📦</Text>
                <Text style={styles.sectionTitle}>DANH SÁCH MẶT HÀNG</Text>
              </View>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{items.length} dòng</Text>
              </View>
            </View>

            {items.map((it, idx) => {
              const product = productById(it.productId)
              const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
              const rowError = errors.items?.[it.key]
              const isRowInvalid = !!rowError

              return (
                <View key={it.key} style={[styles.itemCard, isRowInvalid && styles.cardErrorBorder]}>
                  {/* Header của từng Card sản phẩm */}
                  <View style={styles.itemCardHeader}>
                    <View style={styles.itemCardIndexWrap}>
                      <View style={[styles.indexBadge, isRowInvalid && styles.indexBadgeError]}>
                        <Text style={styles.indexBadgeText}>#{idx + 1}</Text>
                      </View>
                      <Text style={styles.itemCardTitle}>
                        {product ? product.productName : `Mặt hàng ${idx + 1}`}
                      </Text>
                    </View>

                    {items.length > 1 && (
                      <TouchableOpacity
                        onPress={() => removeRow(it.key)}
                        style={styles.deleteRowBtn}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.deleteRowText}>🗑️ Xóa</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Body của Card */}
                  <View style={styles.itemCardBody}>
                    <View style={styles.subField}>
                      <Text style={styles.smallLabel}>Sản phẩm <Text style={styles.requiredStar}>*</Text></Text>
                      <DropdownSelect
                        value={it.productId}
                        label={product ? `${product.productCode} - ${product.productName}` : ''}
                        placeholder="-- Chọn sản phẩm --"
                        options={productOptions}
                        onSelect={(option) => selectProductForLine(it.key, option)}
                        title="Chọn sản phẩm"
                        searchPlaceholder="Tìm theo tên hoặc mã sản phẩm..."
                        style={styles.productDropdownStyle}
                        textStyle={styles.boldText}
                        error={!!rowError?.productId}
                        errorText={rowError?.productId}
                      />
                    </View>

                    <View style={styles.itemInputsRow}>
                      <View style={styles.qtyCol}>
                        <Text style={styles.smallLabel}>Số lượng <Text style={styles.requiredStar}>*</Text></Text>
                        <TextInput
                          style={[
                            styles.qtyInput,
                            styles.boldText,
                            rowError?.quantity && styles.inputError,
                          ]}
                          keyboardType="numeric"
                          value={it.quantity}
                          onChangeText={(v) => updateItem(it.key, { quantity: v })}
                          selectTextOnFocus
                        />
                        {!!rowError?.quantity && (
                          <Text style={styles.rowInlineError}>⚠️ {rowError.quantity}</Text>
                        )}
                      </View>
                      <View style={styles.priceCol}>
                        <Text style={styles.smallLabel}>Đơn giá xuất</Text>
                        <MoneyField
                          value={it.unitPrice}
                          onChangeValue={(v) => updateItem(it.key, { unitPrice: v })}
                          style={[styles.priceInputWrap, rowError?.unitPrice && styles.inputError]}
                          inputStyle={styles.boldText}
                        />
                        {!!rowError?.unitPrice && (
                          <Text style={styles.rowInlineError}>⚠️ {rowError.unitPrice}</Text>
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Footer của Card: Thành tiền */}
                  <View style={styles.itemCardFooter}>
                    <Text style={styles.itemLineLabel}>Thành tiền:</Text>
                    <Text style={styles.itemLineTotal}>{formatVnd(lineTotal)}đ</Text>
                  </View>
                </View>
              )
            })}

            {/* ── Nút Thêm Dòng dạng Outlined Dash thoáng đãng ── */}
            <TouchableOpacity style={styles.addLineBtn} onPress={addRow} activeOpacity={0.75}>
              <Text style={styles.addLineIcon}>＋</Text>
              <Text style={styles.addLineText}>Thêm mặt hàng khác</Text>
            </TouchableOpacity>
          </View>

          {/* ── Card Tổng kết ── */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tổng mặt hàng</Text>
           
            </View>
            <View style={styles.totalDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.grandTotalLabel}>Tổng thanh toán</Text>
              <Text style={styles.grandTotalValue}>{formatVnd(grandTotal)}đ</Text>
            </View>
          </View>

          {/* ── Nút Thao tác ── */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Hủy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : '💾 Lưu phiếu bán hàng'}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>

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
      </SafeAreaView>
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontFamily: fonts.adminDisplayBold, fontSize: 16, color: '#0F172A' },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#EF4444', fontSize: 14, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: { padding: 14, gap: 14, paddingBottom: 40 },
  boldText: { fontFamily: fonts.adminBodyBold },

  cardErrorBorder: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  indexBadgeError: {
    backgroundColor: '#EF4444',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FFF5F5',
  },
  rowInlineError: {
    color: '#EF4444',
    fontFamily: fonts.adminBodyBold,
    fontSize: 11,
    marginTop: 3,
  },

  // Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  sectionIcon: { fontSize: 14 },
  sectionTitle: {
    fontFamily: fonts.adminDisplayBold,
    fontSize: 12.5,
    color: '#475569',
    letterSpacing: 0.5,
  },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fonts.adminBodyBold, fontSize: 12.5, color: '#0F172A' },
  requiredStar: { color: '#EF4444' },
  datePickerBtn: {
    height: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: '#CBD5E1',
    borderRadius: 8, backgroundColor: '#F8FAFC', flexDirection: 'row',
    alignItems: 'center', justifyContent: 'space-between',
  },
  datePickerText: { fontFamily: fonts.adminBodyBold, fontSize: 13.5, color: '#0F172A' },
  datePickerChevron: { fontFamily: fonts.adminBodyBold, fontSize: 10, color: '#94A3B8' },

  // Items Section
  itemsSection: { gap: 12 },
  itemsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 2,
    marginTop: 2,
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  countBadgeText: {
    fontFamily: fonts.adminBodyBold,
    fontSize: 11,
    color: '#475569',
  },

  // Item Card
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
  },
  itemCardIndexWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  indexBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  indexBadgeText: {
    color: '#FFFFFF',
    fontFamily: fonts.adminBodyBold,
    fontSize: 11,
  },
  itemCardTitle: {
    fontFamily: fonts.adminBodyBold,
    fontSize: 13.5,
    color: '#0F172A',
    flex: 1,
  },
  deleteRowBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  deleteRowText: {
    color: '#EF4444',
    fontFamily: fonts.adminBodyBold,
    fontSize: 11.5,
  },

  itemCardBody: { gap: 10 },
  subField: { gap: 4 },
  smallLabel: { fontFamily: fonts.adminBodyBold, fontSize: 11.5, color: '#475569' },
  productDropdownStyle: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },
  itemInputsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  qtyCol: { width: '32%', gap: 4 },
  priceCol: { flex: 1, gap: 4 },
  qtyInput: {
    height: 44, borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12,
    fontSize: 13.5, color: '#0F172A', backgroundColor: '#F8FAFC', textAlign: 'center',
  },
  priceInputWrap: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
  },

  itemCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    borderStyle: 'dashed',
    paddingTop: 10,
    marginTop: 2,
  },
  itemLineLabel: {
    fontFamily: fonts.adminBodyBold,
    fontSize: 12.5,
    color: '#64748B',
  },
  itemLineTotal: {
    fontFamily: fonts.adminDisplayBold,
    fontSize: 15,
    color: admin.primary,
  },

  // Add Line Button (Clean Outline Dash)
  addLineBtn: {
    flexDirection: 'row',
    gap: 8,
    height: 46,
    backgroundColor: '#FFF7ED',
    borderWidth: 1.5,
    borderColor: admin.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  addLineIcon: {
    color: admin.primary,
    fontFamily: fonts.adminBodyBold,
    fontSize: 16,
    lineHeight: 18,
  },
  addLineText: {
    color: admin.primary,
    fontFamily: fonts.adminBodyBold,
    fontSize: 13.5,
  },

  // Summary Card
  summaryCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  summaryLabel: {
    fontFamily: fonts.adminBody,
    fontSize: 12.5,
    color: '#94A3B8',
  },
  summaryValue: {
    fontFamily: fonts.adminBodyBold,
    fontSize: 12.5,
    color: '#E2E8F0',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#334155',
  },
  grandTotalLabel: {
    fontFamily: fonts.adminDisplayBold,
    fontSize: 14,
    color: '#F8FAFC',
  },
  grandTotalValue: {
    fontFamily: fonts.adminDisplayBold,
    fontSize: 20,
    color: '#F2B705',
  },

  // Actions
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1, height: 46, borderWidth: 1, borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF', borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: fonts.adminBodyBold, fontSize: 13.5, color: '#475569' },
  saveBtn: {
    flex: 2, height: 46, backgroundColor: admin.primary,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
    shadowColor: admin.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 2,
  },
  saveBtnText: { fontFamily: fonts.adminBodyBold, fontSize: 14, color: '#FFFFFF' },

  // iOS Picker Modal
  iosModalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  iosModalContent: { backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 20 },
  iosModalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0',
  },
  iosModalTitle: { fontFamily: fonts.adminDisplayBold, fontSize: 15, color: '#0F172A' },
  iosDoneText: { fontFamily: fonts.adminBodyBold, fontSize: 14, color: admin.primary },
  iosPicker: { height: 200 },
})
