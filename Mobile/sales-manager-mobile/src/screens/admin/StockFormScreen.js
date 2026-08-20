import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator, Alert, KeyboardAvoidingView, Modal, Platform, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import DateTimePicker from '@react-native-community/datetimepicker'
import Toast from 'react-native-toast-message'
import { salesInvoiceService } from '../../services/salesInvoiceService'
import { customerService } from '../../services/customerService'
import { productService } from '../../services/productService'
import { useAuth } from '../../context/auth-context'
import BigPickerModal from '../../components/ui/BigPickerModal'
import MoneyField from '../../components/ui/MoneyField'
import { fonts } from '../../theme/fonts'
import { formatVnd, isSameDay, formatDDMMYYYY, formatYYYYMMDD, WEEKDAYS } from '../../utils/format'

// ── Bảng màu riêng cho màn hình này: tương phản cao, dễ nhìn với người lớn tuổi ──
const C = {
  bg: '#F1F5F9',
  card: '#FFFFFF',
  border: '#CBD5E1',
  text: '#0F172A',
  textSoft: '#475569',
  textMuted: '#64748B',
  primary: '#1D4ED8',
  primarySoft: '#EFF6FF',
  success: '#15803D',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  money: '#B45309',
}

const STEP_LABELS = ['Khách hàng', 'Hàng hóa', 'Kiểm tra']

// Nhãn ngày thân thiện: "Hôm nay", "Hôm qua" hoặc thứ trong tuần.
function dayLabel(date) {
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (isSameDay(date, today)) return 'Hôm nay'
  if (isSameDay(date, yesterday)) return 'Hôm qua'
  return WEEKDAYS[date.getDay()]
}

const newKey = () => Math.random().toString(36).slice(2)

export default function StockFormScreen({ navigation, route }) {
  const { user } = useAuth()
  const invoiceId = route.params?.invoiceId
  const isEdit = !!invoiceId

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customers, setCustomers] = useState([])
  const [products, setProducts] = useState([])

  const [step, setStep] = useState(0)               // 0: khách hàng · 1: hàng hóa · 2: kiểm tra
  const [customerId, setCustomerId] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(new Date())
  const [items, setItems] = useState([])            // { key, productId, quantity, unitPrice }

  const [showDatePicker, setShowDatePicker] = useState(false)
  const [picker, setPicker] = useState(null)        // 'customer' | 'product' | null
  const [stepError, setStepError] = useState('')
  const [rowErrors, setRowErrors] = useState({})    // { [key]: { quantity, unitPrice } }
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    Promise.all([
      customerService.getAll(),
      productService.getAll(),
      isEdit ? salesInvoiceService.getById(invoiceId) : Promise.resolve(null),
    ])
      .then(([customerList, productList, invoice]) => {
        setCustomers(customerList || [])
        setProducts(productList || [])
        if (invoice) {
          setCustomerId(String(invoice.customerId))
          setCustomerName(invoice.customerName || '')
          setInvoiceDate(invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date())
          setItems(
            (invoice.items || []).map((it) => ({
              key: newKey(),
              productId: String(it.productId),
              // Bỏ phần thập phân thừa (vd "5.00" -> "5") cho dễ đọc/dễ sửa.
              quantity: String(Number(it.quantity)),
              unitPrice: it.unitPrice,
            }))
          )
        }
      })
      .catch((err) => Toast.show({ type: 'error', text1: err.message || 'Không tải được dữ liệu' }))
      .finally(() => setLoading(false))
  }, [invoiceId, isEdit])

  const productById = (id) => products.find((p) => String(p.id) === String(id))
  const customerById = (id) => customers.find((c) => String(c.id) === String(id))

  const grandTotal = useMemo(
    () => items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0),
    [items]
  )

  // ── Cập nhật dòng hàng ──
  const updateItem = (key, patch) => {
    setDirty(true)
    setItems((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)))
    setRowErrors((prev) => {
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
    setStepError('')
  }

  const changeQty = (key, delta) => {
    const row = items.find((it) => it.key === key)
    if (!row) return
    const next = Math.max(1, (Number(row.quantity) || 0) + delta)
    updateItem(key, { quantity: String(next) })
  }

  const addProduct = (product) => {
    setPicker(null)
    setDirty(true)
    setStepError('')
    const existing = items.find((it) => String(it.productId) === String(product.id))
    if (existing) {
      const next = (Number(existing.quantity) || 0) + 1
      updateItem(existing.key, { quantity: String(next) })
      Toast.show({
        type: 'success',
        text1: `Đã tăng số lượng: ${product.productName}`,
        text2: `Số lượng hiện tại: ${next}`,
      })
      return
    }
    setItems((list) => [
      ...list,
      { key: newKey(), productId: String(product.id), quantity: '1', unitPrice: product.price ?? 0 },
    ])
    Toast.show({ type: 'success', text1: `Đã thêm: ${product.productName}` })
  }

  const removeRow = (key) => {
    const row = items.find((it) => it.key === key)
    const product = row ? productById(row.productId) : null
    Alert.alert(
      'Bỏ mặt hàng này?',
      product ? `"${product.productName}" sẽ được xóa khỏi phiếu.` : 'Mặt hàng sẽ được xóa khỏi phiếu.',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Bỏ mặt hàng',
          style: 'destructive',
          onPress: () => {
            setDirty(true)
            setItems((list) => list.filter((it) => it.key !== key))
          },
        },
      ]
    )
  }

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (selectedDate) {
      setInvoiceDate(selectedDate)
      setDirty(true)
    }
  }

  // ── Kiểm tra dữ liệu từng bước ──
  const checkStep = (index) => {
    if (index === 0) {
      if (!customerId) {
        setStepError('Bạn chưa chọn khách hàng. Hãy bấm vào ô lớn phía trên để chọn.')
        return false
      }
      return true
    }
    if (index === 1) {
      if (items.length === 0) {
        setStepError('Phiếu chưa có mặt hàng nào. Hãy bấm nút "THÊM MẶT HÀNG".')
        return false
      }
      const errs = {}
      items.forEach((it) => {
        const rowErr = {}
        if (!it.quantity || isNaN(Number(it.quantity)) || Number(it.quantity) <= 0) {
          rowErr.quantity = 'Số lượng phải lớn hơn 0'
        }
        if (it.unitPrice === '' || isNaN(Number(it.unitPrice)) || Number(it.unitPrice) < 0) {
          rowErr.unitPrice = 'Đơn giá không hợp lệ'
        }
        if (Object.keys(rowErr).length) errs[it.key] = rowErr
      })
      setRowErrors(errs)
      if (Object.keys(errs).length) {
        setStepError('Có mặt hàng chưa đúng. Hãy xem các ô viền đỏ bên dưới.')
        return false
      }
      return true
    }
    return true
  }

  const goNext = () => {
    if (!checkStep(step)) return
    setStepError('')
    setStep((s) => Math.min(2, s + 1))
  }

  const goStep = (index) => {
    if (index === step) return
    if (index < step) {
      setStepError('')
      setStep(index)
      return
    }
    for (let i = step; i < index; i += 1) {
      if (!checkStep(i)) {
        setStep(i)
        return
      }
    }
    setStepError('')
    setStep(index)
  }

  const handleBack = () => {
    if (step > 0) {
      setStepError('')
      setStep((s) => s - 1)
      return
    }
    handleClose()
  }

  const handleClose = () => {
    if (!dirty) {
      navigation.goBack()
      return
    }
    Alert.alert('Thoát mà không lưu?', 'Những thông tin bạn vừa nhập sẽ bị mất.', [
      { text: 'Ở lại', style: 'cancel' },
      { text: 'Thoát', style: 'destructive', onPress: () => navigation.goBack() },
    ])
  }

  const handleSave = async () => {
    if (!checkStep(0)) { setStep(0); return }
    if (!checkStep(1)) { setStep(1); return }

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
        Toast.show({ type: 'success', text1: 'Đã cập nhật phiếu bán hàng' })
      } else {
        await salesInvoiceService.create(payload)
        Toast.show({ type: 'success', text1: 'Đã lưu phiếu bán hàng' })
      }
      navigation.goBack()
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message || 'Có lỗi xảy ra, chưa lưu được' })
    } finally {
      setSaving(false)
    }
  }

  // ── Dữ liệu cho bộ chọn ──
  const customerOptions = customers.map((c) => ({
    value: String(c.id),
    label: c.fullName,
    sublabel: c.phoneNumber ? `📞 ${c.phoneNumber}` : '',
    note: c.address || '',
    picked: String(c.id) === String(customerId),
  }))

  const productOptions = products.map((p) => ({
    value: String(p.id),
    label: p.productName,
    sublabel: `Giá bán: ${formatVnd(p.price)}đ${p.unit ? ` / ${p.unit}` : ''}`,
    note: `Mã ${p.productCode}  ·  Còn ${formatVnd(p.stockQuantity)}${p.unit ? ` ${p.unit}` : ''}`,
    picked: items.some((it) => String(it.productId) === String(p.id)),
  }))

  const selectedCustomer = customerById(customerId)

  if (loading) {
    return (
      <View style={styles.loadingRoot}>
        <ActivityIndicator size="large" color={C.primary} />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        {/* ══ Thanh trên cùng ══ */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={handleBack} activeOpacity={0.7}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle}>{isEdit ? 'Sửa phiếu bán hàng' : 'Tạo phiếu bán hàng'}</Text>
            <Text style={styles.headerSubtitle}>Bước {step + 1} trên 3 · {STEP_LABELS[step]}</Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ══ Thanh 3 bước ══ */}
        <View style={styles.stepsBar}>
          {STEP_LABELS.map((label, index) => {
            const done = index < step
            const active = index === step
            return (
              <TouchableOpacity
                key={label}
                style={styles.stepItem}
                onPress={() => goStep(index)}
                activeOpacity={0.7}
              >
                <View style={[styles.stepDot, done && styles.stepDotDone, active && styles.stepDotActive]}>
                  <Text style={[styles.stepDotText, (done || active) && styles.stepDotTextOn]}>
                    {done ? '✓' : index + 1}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, active && styles.stepLabelActive]} numberOfLines={1}>
                  {label}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Băng thông báo lỗi bằng lời dễ hiểu ── */}
            {!!stepError && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorBannerIcon}>⚠️</Text>
                <Text style={styles.errorBannerText}>{stepError}</Text>
              </View>
            )}

            {/* ══════════ BƯỚC 1: KHÁCH HÀNG & NGÀY ══════════ */}
            {step === 0 && (
              <>
                <Text style={styles.bigQuestion}>Bán cho ai?</Text>

                <TouchableOpacity
                  style={[styles.pickBox, !!customerId && styles.pickBoxFilled, !!stepError && !customerId && styles.pickBoxError]}
                  onPress={() => setPicker('customer')}
                  activeOpacity={0.7}
                >
                  <View style={styles.pickBoxLeft}>
                    <Text style={styles.pickBoxIcon}>👤</Text>
                    <View style={styles.pickBoxTextWrap}>
                      {customerId ? (
                        <>
                          <Text style={styles.pickBoxValue} numberOfLines={2}>
                            {selectedCustomer?.fullName || customerName}
                          </Text>
                          {!!selectedCustomer?.phoneNumber && (
                            <Text style={styles.pickBoxSub}>📞 {selectedCustomer.phoneNumber}</Text>
                          )}
                        </>
                      ) : (
                        <Text style={styles.pickBoxPlaceholder}>Chạm để chọn khách hàng</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.pickBoxAction}>{customerId ? 'Đổi' : 'Chọn'}</Text>
                </TouchableOpacity>

                <Text style={styles.bigQuestion}>Bán ngày nào?</Text>

                <View style={styles.dateCard}>
                  <View style={styles.dateDisplay}>
                    <Text style={styles.dateBig}>{formatDDMMYYYY(invoiceDate)}</Text>
                    <Text style={styles.dateDay}>{dayLabel(invoiceDate)}</Text>
                  </View>
                  <View style={styles.dateBtnRow}>
                    <TouchableOpacity
                      style={[styles.dateQuickBtn, isSameDay(invoiceDate, new Date()) && styles.dateQuickBtnOn]}
                      onPress={() => { setInvoiceDate(new Date()); setDirty(true) }}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[styles.dateQuickText, isSameDay(invoiceDate, new Date()) && styles.dateQuickTextOn]}
                      >
                        Hôm nay
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.dateQuickBtn}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dateQuickText}>📅  Chọn ngày khác</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.helperNote}>
                  Xong bước này, bấm nút xanh bên dưới để sang bước chọn hàng.
                </Text>
              </>
            )}

            {/* ══════════ BƯỚC 2: HÀNG HÓA ══════════ */}
            {step === 1 && (
              <>
                <Text style={styles.bigQuestion}>Bán những hàng gì?</Text>

                <TouchableOpacity style={styles.addBigBtn} onPress={() => setPicker('product')} activeOpacity={0.8}>
                  <Text style={styles.addBigIcon}>＋</Text>
                  <Text style={styles.addBigText}>THÊM MẶT HÀNG</Text>
                </TouchableOpacity>

                {items.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyIcon}>📦</Text>
                    <Text style={styles.emptyTitle}>Chưa có mặt hàng nào</Text>
                    <Text style={styles.emptyHint}>Bấm nút “THÊM MẶT HÀNG” ở trên để chọn hàng cần bán.</Text>
                  </View>
                ) : (
                  items.map((it, idx) => {
                    const product = productById(it.productId)
                    const rowErr = rowErrors[it.key]
                    const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                    return (
                      <View key={it.key} style={[styles.itemCard, !!rowErr && styles.itemCardError]}>
                        {/* Tên hàng */}
                        <View style={styles.itemHead}>
                          <View style={styles.itemIndex}>
                            <Text style={styles.itemIndexText}>{idx + 1}</Text>
                          </View>
                          <View style={styles.itemHeadText}>
                            <Text style={styles.itemName} numberOfLines={2}>
                              {product ? product.productName : 'Mặt hàng'}
                            </Text>
                            {!!product && (
                              <Text style={styles.itemMeta}>
                                Mã {product.productCode}
                                {product.unit ? `  ·  Đơn vị: ${product.unit}` : ''}
                              </Text>
                            )}
                          </View>
                        </View>

                        {/* Số lượng: nút trừ / cộng cỡ lớn */}
                        <Text style={styles.fieldLabel}>Số lượng</Text>
                        <View style={styles.qtyRow}>
                          <TouchableOpacity
                            style={[styles.qtyBtn, Number(it.quantity) <= 1 && styles.qtyBtnOff]}
                            onPress={() => changeQty(it.key, -1)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.qtyBtnText}>−</Text>
                          </TouchableOpacity>
                          <TextInput
                            style={[styles.qtyInput, !!rowErr?.quantity && styles.inputError]}
                            keyboardType="number-pad"
                            value={String(it.quantity)}
                            onChangeText={(v) => updateItem(it.key, { quantity: v.replace(/\D/g, '') })}
                            selectTextOnFocus
                          />
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => changeQty(it.key, 1)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.qtyBtnText}>＋</Text>
                          </TouchableOpacity>
                        </View>
                        {!!rowErr?.quantity && <Text style={styles.inlineError}>⚠️ {rowErr.quantity}</Text>}

                        {/* Đơn giá */}
                        <Text style={styles.fieldLabel}>Đơn giá bán</Text>
                        <MoneyField
                          value={it.unitPrice}
                          onChangeValue={(v) => updateItem(it.key, { unitPrice: v })}
                          style={[styles.priceWrap, !!rowErr?.unitPrice && styles.inputError]}
                          inputStyle={styles.priceInput}
                        />
                        {!!rowErr?.unitPrice && <Text style={styles.inlineError}>⚠️ {rowErr.unitPrice}</Text>}
                        {!!product && Number(it.unitPrice) !== Number(product.price) && (
                          <TouchableOpacity
                            onPress={() => updateItem(it.key, { unitPrice: product.price ?? 0 })}
                            activeOpacity={0.7}
                            style={styles.resetPriceBtn}
                          >
                            <Text style={styles.resetPriceText}>
                              ↺  Về giá niêm yết {formatVnd(product.price)}đ
                            </Text>
                          </TouchableOpacity>
                        )}

                        {/* Thành tiền + Bỏ hàng */}
                        <View style={styles.itemFooter}>
                          <Text style={styles.itemFooterLabel}>Thành tiền</Text>
                          <Text style={styles.itemFooterValue}>{formatVnd(lineTotal)}đ</Text>
                        </View>
                        <TouchableOpacity style={styles.removeBtn} onPress={() => removeRow(it.key)} activeOpacity={0.7}>
                          <Text style={styles.removeBtnText}>🗑  Bỏ mặt hàng này</Text>
                        </TouchableOpacity>
                      </View>
                    )
                  })
                )}
              </>
            )}

            {/* ══════════ BƯỚC 3: KIỂM TRA & LƯU ══════════ */}
            {step === 2 && (
              <>
                <Text style={styles.bigQuestion}>Kiểm tra lại phiếu</Text>

                <View style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <Text style={styles.reviewHeadText}>KHÁCH HÀNG</Text>
                    <TouchableOpacity onPress={() => setStep(0)} activeOpacity={0.7} style={styles.editLinkBtn}>
                      <Text style={styles.editLinkText}>Sửa</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.reviewValue}>{selectedCustomer?.fullName || customerName}</Text>
                  {!!selectedCustomer?.phoneNumber && (
                    <Text style={styles.reviewSub}>📞 {selectedCustomer.phoneNumber}</Text>
                  )}
                  <View style={styles.reviewDivider} />
                  <View style={styles.reviewHead}>
                    <Text style={styles.reviewHeadText}>NGÀY BÁN</Text>
                  </View>
                  <Text style={styles.reviewValue}>
                    {formatDDMMYYYY(invoiceDate)} <Text style={styles.reviewSub}>({dayLabel(invoiceDate)})</Text>
                  </Text>
                </View>

                <View style={styles.reviewCard}>
                  <View style={styles.reviewHead}>
                    <Text style={styles.reviewHeadText}>HÀNG BÁN ({items.length} mặt hàng)</Text>
                    <TouchableOpacity onPress={() => setStep(1)} activeOpacity={0.7} style={styles.editLinkBtn}>
                      <Text style={styles.editLinkText}>Sửa</Text>
                    </TouchableOpacity>
                  </View>
                  {items.map((it, idx) => {
                    const product = productById(it.productId)
                    const lineTotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)
                    return (
                      <View key={it.key} style={styles.reviewLine}>
                        <Text style={styles.reviewLineName} numberOfLines={2}>
                          {idx + 1}. {product ? product.productName : 'Mặt hàng'}
                        </Text>
                        <View style={styles.reviewLineBottom}>
                          <Text style={styles.reviewLineCalc}>
                            {formatVnd(it.quantity)}{product?.unit ? ` ${product.unit}` : ''} × {formatVnd(it.unitPrice)}đ
                          </Text>
                          <Text style={styles.reviewLineTotal}>{formatVnd(lineTotal)}đ</Text>
                        </View>
                      </View>
                    )
                  })}
                </View>

                <View style={styles.totalCard}>
                  <Text style={styles.totalCardLabel}>KHÁCH PHẢI TRẢ</Text>
                  <Text style={styles.totalCardValue}>{formatVnd(grandTotal)}đ</Text>
                </View>

                <Text style={styles.helperNote}>
                  Nếu mọi thứ đã đúng, bấm nút xanh “LƯU PHIẾU” bên dưới.
                </Text>
              </>
            )}
          </ScrollView>

          {/* ══ Thanh dưới cùng: luôn hiện, nút to ══ */}
          <View style={styles.footer}>
            {step === 1 && items.length > 0 && (
              <View style={styles.footerTotalRow}>
                <Text style={styles.footerTotalLabel}>Tổng cộng ({items.length} mặt hàng)</Text>
                <Text style={styles.footerTotalValue}>{formatVnd(grandTotal)}đ</Text>
              </View>
            )}
            <View style={styles.footerBtnRow}>
              <TouchableOpacity style={styles.backBigBtn} onPress={handleBack} activeOpacity={0.7}>
                <Text style={styles.backBigText}>{step === 0 ? 'Hủy' : '‹  Quay lại'}</Text>
              </TouchableOpacity>
              {step < 2 ? (
                <TouchableOpacity style={styles.nextBigBtn} onPress={goNext} activeOpacity={0.85}>
                  <Text style={styles.nextBigText}>TIẾP TỤC  ›</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.saveBigBtn, saving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  <Text style={styles.nextBigText}>{saving ? 'ĐANG LƯU...' : '✓  LƯU PHIẾU'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>

        {/* ══ Bộ chọn khách hàng / sản phẩm ══ */}
        <BigPickerModal
          visible={picker === 'customer'}
          title="Chọn khách hàng"
          hint="Chạm vào tên khách hàng để chọn"
          searchPlaceholder="Gõ tên hoặc số điện thoại..."
          data={customerOptions}
          onSelect={(option) => {
            setCustomerId(option.value)
            setCustomerName(option.label)
            setDirty(true)
            setStepError('')
            setPicker(null)
          }}
          onClose={() => setPicker(null)}
          emptyText="Không tìm thấy khách hàng nào"
        />

        <BigPickerModal
          visible={picker === 'product'}
          title="Chọn mặt hàng"
          hint="Chạm vào mặt hàng để thêm vào phiếu"
          searchPlaceholder="Gõ tên hoặc mã hàng..."
          data={productOptions}
          onSelect={(option) => {
            const product = productById(option.value)
            if (product) addProduct(product)
          }}
          onClose={() => setPicker(null)}
          emptyText="Không tìm thấy mặt hàng nào"
        />

        {/* ══ Lịch chọn ngày ══ */}
        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker value={invoiceDate} mode="date" display="default" onChange={handleDateChange} />
        )}

        {Platform.OS === 'ios' && (
          <Modal visible={showDatePicker} transparent animationType="slide">
            <TouchableOpacity style={styles.iosOverlay} activeOpacity={1} onPress={() => setShowDatePicker(false)}>
              <View style={styles.iosSheet}>
                <View style={styles.iosSheetHead}>
                  <Text style={styles.iosSheetTitle}>Chọn ngày bán</Text>
                  <TouchableOpacity onPress={() => setShowDatePicker(false)} style={styles.iosDoneBtn} activeOpacity={0.7}>
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
  root: { flex: 1, backgroundColor: C.bg },
  flex: { flex: 1 },
  loadingRoot: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg, gap: 14 },
  loadingText: { fontFamily: fonts.adminBodyMedium, fontSize: 17, color: C.textSoft },

  // ── Header ──
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 42, height: 42, borderRadius: 11, backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center',
  },
  backBtnText: { fontSize: 28, lineHeight: 32, color: C.textSoft, fontFamily: fonts.adminBodyBold },
  headerTitleWrap: { flex: 1, gap: 2 },
  headerTitle: { fontFamily: fonts.adminDisplayBold, fontSize: 17, color: C.text },
  headerSubtitle: { fontFamily: fonts.adminBodyMedium, fontSize: 12.5, color: C.textMuted },
  closeBtn: {
    width: 42, height: 42, borderRadius: 11, backgroundColor: C.dangerSoft,
    alignItems: 'center', justifyContent: 'center',
  },
  closeBtnText: { fontSize: 17, color: C.danger, fontFamily: fonts.adminBodyBold },

  // ── Thanh 3 bước ──
  stepsBar: {
    flexDirection: 'row', backgroundColor: C.card,
    paddingHorizontal: 8, paddingBottom: 10, gap: 4,
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  stepItem: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 3 },
  stepDot: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  stepDotActive: { backgroundColor: C.primary },
  stepDotDone: { backgroundColor: C.success },
  stepDotText: { fontFamily: fonts.adminBodyBold, fontSize: 14, color: C.textMuted },
  stepDotTextOn: { color: '#FFFFFF' },
  stepLabel: { fontFamily: fonts.adminBodyMedium, fontSize: 12, color: C.textMuted },
  stepLabelActive: { fontFamily: fonts.adminBodyBold, color: C.text },

  // ── Nội dung ──
  body: { flex: 1 },
  bodyContent: { padding: 14, paddingBottom: 24, gap: 12 },
  bigQuestion: { fontFamily: fonts.adminDisplayBold, fontSize: 19, color: C.text, marginTop: 2 },
  helperNote: {
    fontFamily: fonts.adminBody, fontSize: 13.5, color: C.textMuted,
    lineHeight: 20, paddingHorizontal: 2,
  },

  errorBanner: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: C.dangerSoft, borderWidth: 2, borderColor: '#FCA5A5',
    borderRadius: 12, padding: 12,
  },
  errorBannerIcon: { fontSize: 17 },
  errorBannerText: { flex: 1, fontFamily: fonts.adminBodyBold, fontSize: 14, color: '#991B1B', lineHeight: 20 },

  // ── Ô chọn lớn (khách hàng) ──
  pickBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
    minHeight: 68, paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: C.card, borderWidth: 2, borderColor: C.border,
    borderRadius: 14, borderStyle: 'dashed',
  },
  pickBoxFilled: { borderStyle: 'solid', borderColor: C.primary, backgroundColor: C.primarySoft },
  pickBoxError: { borderColor: C.danger, backgroundColor: '#FEF2F2', borderStyle: 'solid' },
  pickBoxLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  pickBoxIcon: { fontSize: 24 },
  pickBoxTextWrap: { flex: 1, gap: 2 },
  pickBoxPlaceholder: { fontFamily: fonts.adminBodyMedium, fontSize: 15, color: C.textMuted },
  pickBoxValue: { fontFamily: fonts.adminBodyBold, fontSize: 16.5, color: C.text, lineHeight: 21 },
  pickBoxSub: { fontFamily: fonts.adminBodyMedium, fontSize: 13.5, color: C.textSoft },
  pickBoxAction: {
    fontFamily: fonts.adminBodyBold, fontSize: 13.5, color: C.primary,
    paddingHorizontal: 10, paddingVertical: 7, backgroundColor: '#FFFFFF',
    borderRadius: 9, overflow: 'hidden',
  },

  // ── Ngày bán ──
  dateCard: {
    backgroundColor: C.card, borderWidth: 2, borderColor: C.border,
    borderRadius: 14, padding: 14, gap: 12,
  },
  dateDisplay: { alignItems: 'center', gap: 2 },
  dateBig: { fontFamily: fonts.adminDisplayBold, fontSize: 27, color: C.text, letterSpacing: 0.4 },
  dateDay: { fontFamily: fonts.adminBodyMedium, fontSize: 14.5, color: C.textSoft },
  dateBtnRow: { flexDirection: 'row', gap: 8 },
  dateQuickBtn: {
    flex: 1, height: 46, borderRadius: 11, borderWidth: 2, borderColor: C.border,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
  },
  dateQuickBtnOn: { borderColor: C.primary, backgroundColor: C.primarySoft },
  dateQuickText: { fontFamily: fonts.adminBodyBold, fontSize: 13.5, color: C.textSoft },
  dateQuickTextOn: { color: C.primary },

  // ── Nút thêm mặt hàng ──
  addBigBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, borderRadius: 13, backgroundColor: C.primary,
    shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  addBigIcon: { color: '#FFFFFF', fontFamily: fonts.adminBodyBold, fontSize: 20, lineHeight: 24 },
  addBigText: { color: '#FFFFFF', fontFamily: fonts.adminBodyBold, fontSize: 15.5, letterSpacing: 0.4 },

  emptyBox: {
    alignItems: 'center', gap: 8, paddingVertical: 28, paddingHorizontal: 18,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed',
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontFamily: fonts.adminBodyBold, fontSize: 16.5, color: C.text },
  emptyHint: { fontFamily: fonts.adminBody, fontSize: 13.5, color: C.textMuted, textAlign: 'center', lineHeight: 19 },

  // ── Thẻ mặt hàng ──
  itemCard: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 2, borderColor: '#E2E8F0',
    padding: 13, gap: 7,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  itemCardError: { borderColor: C.danger },
  itemHead: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', paddingBottom: 5 },
  itemIndex: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: C.text,
    alignItems: 'center', justifyContent: 'center',
  },
  itemIndexText: { color: '#FFFFFF', fontFamily: fonts.adminBodyBold, fontSize: 13.5 },
  itemHeadText: { flex: 1, gap: 2 },
  itemName: { fontFamily: fonts.adminBodyBold, fontSize: 16, color: C.text, lineHeight: 21 },
  itemMeta: { fontFamily: fonts.adminBody, fontSize: 12.5, color: C.textMuted },

  fieldLabel: { fontFamily: fonts.adminBodyBold, fontSize: 13.5, color: C.textSoft, marginTop: 5 },

  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  qtyBtn: {
    width: 48, height: 48, borderRadius: 12, backgroundColor: '#E2E8F0',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnOff: { opacity: 0.45 },
  qtyBtnText: { fontFamily: fonts.adminBodyBold, fontSize: 23, lineHeight: 27, color: C.text },
  qtyInput: {
    flex: 1, height: 48, borderWidth: 2, borderColor: C.border, borderRadius: 12,
    textAlign: 'center', fontSize: 20, color: C.text,
    fontFamily: fonts.adminBodyBold, backgroundColor: '#F8FAFC', paddingVertical: 0,
  },

  priceWrap: {
    height: 48, borderWidth: 2, borderColor: C.border, borderRadius: 12,
    backgroundColor: '#F8FAFC', paddingRight: 14,
  },
  priceInput: { fontSize: 18, fontFamily: fonts.adminBodyBold, paddingHorizontal: 14 },
  inputError: { borderColor: C.danger, backgroundColor: '#FEF2F2' },
  inlineError: { fontFamily: fonts.adminBodyBold, fontSize: 12.5, color: C.danger },
  resetPriceBtn: { alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 2 },
  resetPriceText: { fontFamily: fonts.adminBodyMedium, fontSize: 13, color: C.primary },

  itemFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 10, marginTop: 6,
  },
  itemFooterLabel: { fontFamily: fonts.adminBodyBold, fontSize: 14, color: C.textSoft },
  itemFooterValue: { fontFamily: fonts.adminDisplayBold, fontSize: 19, color: C.money },
  removeBtn: {
    height: 44, borderRadius: 11, borderWidth: 2, borderColor: '#FCA5A5',
    backgroundColor: C.dangerSoft, alignItems: 'center', justifyContent: 'center', marginTop: 3,
  },
  removeBtnText: { fontFamily: fonts.adminBodyBold, fontSize: 13.5, color: C.danger },

  // ── Bước kiểm tra ──
  reviewCard: {
    backgroundColor: C.card, borderRadius: 14, borderWidth: 2, borderColor: '#E2E8F0',
    padding: 14, gap: 5,
  },
  reviewHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  reviewHeadText: { fontFamily: fonts.adminBodyBold, fontSize: 12.5, color: C.textMuted, letterSpacing: 0.5 },
  editLinkBtn: {
    paddingHorizontal: 13, paddingVertical: 6, borderRadius: 9,
    backgroundColor: C.primarySoft, borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  editLinkText: { fontFamily: fonts.adminBodyBold, fontSize: 13, color: C.primary },
  reviewValue: { fontFamily: fonts.adminBodyBold, fontSize: 17, color: C.text, lineHeight: 23 },
  reviewSub: { fontFamily: fonts.adminBodyMedium, fontSize: 13.5, color: C.textSoft },
  reviewDivider: { height: 1, backgroundColor: '#E2E8F0', marginVertical: 10 },
  reviewLine: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', gap: 3 },
  reviewLineName: { fontFamily: fonts.adminBodyBold, fontSize: 15, color: C.text, lineHeight: 20 },
  reviewLineBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 10 },
  reviewLineCalc: { fontFamily: fonts.adminBodyMedium, fontSize: 13.5, color: C.textSoft },
  reviewLineTotal: { fontFamily: fonts.adminBodyBold, fontSize: 15.5, color: C.money },

  totalCard: {
    backgroundColor: C.text, borderRadius: 14, padding: 16, gap: 5, alignItems: 'center',
  },
  totalCardLabel: { fontFamily: fonts.adminBodyBold, fontSize: 13, color: '#CBD5E1', letterSpacing: 0.8 },
  totalCardValue: { fontFamily: fonts.adminDisplayBold, fontSize: 30, color: '#FBBF24' },

  // ── Thanh dưới ──
  footer: {
    backgroundColor: C.card, borderTopWidth: 1, borderTopColor: '#E2E8F0',
    paddingHorizontal: 14, paddingTop: 10, paddingBottom: 10, gap: 8,
    shadowColor: '#0F172A', shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  footerTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  footerTotalLabel: { fontFamily: fonts.adminBodyMedium, fontSize: 13.5, color: C.textSoft },
  footerTotalValue: { fontFamily: fonts.adminDisplayBold, fontSize: 21, color: C.money },
  footerBtnRow: { flexDirection: 'row', gap: 8 },
  backBigBtn: {
    flex: 1, height: 52, borderRadius: 12, borderWidth: 2, borderColor: C.border,
    backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center',
  },
  backBigText: { fontFamily: fonts.adminBodyBold, fontSize: 14.5, color: C.textSoft },
  nextBigBtn: {
    flex: 2, height: 52, borderRadius: 12, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.primary, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  saveBigBtn: {
    flex: 2, height: 52, borderRadius: 12, backgroundColor: C.success,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.success, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 6, elevation: 3,
  },
  nextBigText: { fontFamily: fonts.adminBodyBold, fontSize: 16, color: '#FFFFFF', letterSpacing: 0.4 },
  btnDisabled: { opacity: 0.6 },

  // ── Lịch iOS ──
  iosOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  iosSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 24 },
  iosSheetHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
  },
  iosSheetTitle: { fontFamily: fonts.adminDisplayBold, fontSize: 19, color: C.text },
  iosDoneBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, backgroundColor: C.primarySoft },
  iosDoneText: { fontFamily: fonts.adminBodyBold, fontSize: 17, color: C.primary },
  iosPicker: { height: 220 },
})
