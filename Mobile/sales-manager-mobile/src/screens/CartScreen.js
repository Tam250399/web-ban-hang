import { useEffect, useState } from 'react'
import { FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import { useCart } from '../context/cart-context'
import { useRequireOnline } from '../hooks/useRequireOnline'
import { successFeedback, errorFeedback } from '../services/haptics'
import { useAuth } from '../context/auth-context'
import { orderService } from '../services/orderService'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'
import { formatVnd } from '../utils/format'
import { Icon, ICON_ROW } from '../components/ui/Icon'

// Component điều khiển số lượng: có nút − / + và ô TextInput nhập số trực tiếp
function QtyControl({ quantity, maxStock, onChangeQty, compact = false }) {
  const [localText, setLocalText] = useState(String(quantity))

  useEffect(() => {
    setLocalText(String(quantity))
  }, [quantity])

  const handleTextChange = (text) => {
    const clean = text.replace(/[^0-9]/g, '')
    setLocalText(clean)
    const num = parseInt(clean, 10)
    if (!isNaN(num) && num > 0) {
      const clamped = maxStock ? Math.min(num, maxStock) : num
      onChangeQty(clamped)
    }
  }

  const handleBlur = () => {
    const num = parseInt(localText, 10)
    if (isNaN(num) || num < 1) {
      setLocalText('1')
      onChangeQty(1)
    } else if (maxStock && num > maxStock) {
      setLocalText(String(maxStock))
      onChangeQty(maxStock)
      Toast.show({ type: 'info', text1: `Số lượng tối đa còn trong kho: ${maxStock}` })
    }
  }

  return (
    <View style={[styles.qtyControls, compact && styles.qtyControlsCompact]}>
      <TouchableOpacity
        style={[styles.qtyBtn, compact && styles.qtyBtnCompact, quantity <= 1 && styles.qtyBtnDisabled]}
        onPress={() => onChangeQty(quantity - 1)}
        disabled={quantity <= 1}
        activeOpacity={0.7}
        hitSlop={6}
        accessibilityLabel="Giảm số lượng"
      >
        <Text style={[styles.qtyBtnText, compact && styles.qtyBtnTextCompact]}>−</Text>
      </TouchableOpacity>

      <TextInput
        style={[styles.qtyInput, compact && styles.qtyInputCompact]}
        value={localText}
        keyboardType="number-pad"
        onChangeText={handleTextChange}
        onBlur={handleBlur}
        selectTextOnFocus
        maxLength={6}
      />

      <TouchableOpacity
        style={[
          styles.qtyBtn,
          compact && styles.qtyBtnCompact,
          maxStock && quantity >= maxStock && styles.qtyBtnDisabled,
        ]}
        onPress={() => {
          if (maxStock && quantity >= maxStock) {
            Toast.show({ type: 'info', text1: `Số lượng tối đa còn trong kho: ${maxStock}` })
            return
          }
          onChangeQty(quantity + 1)
        }}
        activeOpacity={0.7}
        hitSlop={6}
        accessibilityLabel="Tăng số lượng"
      >
        <Text style={[styles.qtyBtnText, compact && styles.qtyBtnTextCompact]}>+</Text>
      </TouchableOpacity>
    </View>
  )
}

export default function CartScreen() {
  const navigation = useNavigation()
  const { items, updateQuantity, removeItem, clear, totalPrice } = useCart()
  const { user, isGuest } = useAuth()
  const requireOnline = useRequireOnline()
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [form, setForm] = useState({
    recipientName: user?.fullName || user?.username || '',
    phoneNumber: user?.phoneNumber || '',
    address: '',
    note: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const setField = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const openCheckout = () => {
    if (isGuest) {
      navigation.navigate('Login')
      return
    }
    setForm({
      recipientName: user?.fullName || user?.username || '',
      phoneNumber: user?.phoneNumber || '',
      address: '',
      note: '',
    })
    setCheckoutOpen(true)
  }

  const handleSubmit = async () => {
    if (!form.recipientName.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập tên người nhận' })
      return
    }
    if (!form.phoneNumber.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập số điện thoại' })
      return
    }
    // Giỏ hàng đã lưu trên máy nên không mất gì — người dùng đặt lại được ngay
    // khi có sóng, miễn là biết rõ vì sao chưa gửi được.
    if (!requireOnline('Đặt hàng')) return
    setSubmitting(true)
    try {
      await orderService.create({
        recipientName: form.recipientName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim() || null,
        note: form.note.trim() || null,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      successFeedback()
      Toast.show({ type: 'success', text1: 'Đặt hàng thành công! Chúng tôi sẽ liên hệ xác nhận sớm.' })
      clear()
      setCheckoutOpen(false)
    } catch (err) {
      errorFeedback()
      Toast.show({ type: 'error', text1: err.message || 'Đặt hàng thất bại.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.empty} edges={['top']}>
        <Icon name="cart" size={48} color={brand.textMuted} />
        <Text style={styles.emptyText}>Giỏ hàng của bạn đang trống</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.productId)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowInfo}>
              <Text style={styles.name} numberOfLines={2}>{item.productName}</Text>
              <Text style={styles.unitPrice}>{formatVnd(item.price)}đ / {item.unit}</Text>
            </View>
            <QtyControl
              quantity={item.quantity}
              maxStock={item.maxStock}
              onChangeQty={(qty) => updateQuantity(item.productId, qty)}
            />
            <TouchableOpacity onPress={() => removeItem(item.productId)} style={styles.removeBtn}>
              <Text style={styles.removeText}>Xóa</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng cộng</Text>
          <Text style={styles.totalValue}>{formatVnd(totalPrice)}đ</Text>
        </View>
        <TouchableOpacity style={styles.checkoutBtn} onPress={openCheckout}>
          <Text style={styles.checkoutBtnText}>Đặt hàng</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={checkoutOpen} animationType="slide" onRequestClose={() => setCheckoutOpen(false)}>
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalRoot} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông tin đơn hàng</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setCheckoutOpen(false)} hitSlop={8} accessibilityLabel="Đóng">
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView contentContainerStyle={styles.modalBody} keyboardShouldPersistTaps="handled">
              {/* ── Danh sách sản phẩm trong đơn (có thể điền số lượng trực tiếp) ── */}
              <View style={styles.orderSummarySection}>
                <View style={ICON_ROW}>
                  <Icon name="box" size={16} color={brand.text} />
                  <Text style={styles.sectionTitle}>Sản phẩm trong đơn</Text>
                </View>
                {items.map((item) => (
                  <View key={item.productId} style={styles.modalItemRow}>
                    <View style={styles.modalItemInfo}>
                      <Text style={styles.modalItemName} numberOfLines={1}>{item.productName}</Text>
                      <Text style={styles.modalItemPrice}>{formatVnd(item.price)}đ / {item.unit}</Text>
                    </View>
                    <QtyControl
                      quantity={item.quantity}
                      maxStock={item.maxStock}
                      onChangeQty={(qty) => updateQuantity(item.productId, qty)}
                      compact
                    />
                  </View>
                ))}
              </View>

              {/* ── Thông tin người nhận & giao hàng ── */}
              <View style={[ICON_ROW, { marginTop: 6 }]}>
                <Icon name="pin" size={16} color={brand.text} />
                <Text style={styles.sectionTitle}>Thông tin giao hàng</Text>
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Tên người nhận *</Text>
                <TextInput style={styles.input} value={form.recipientName} onChangeText={setField('recipientName')} placeholderTextColor={brand.textMuted} />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Số điện thoại *</Text>
                <TextInput style={styles.input} value={form.phoneNumber} onChangeText={setField('phoneNumber')} keyboardType="phone-pad" placeholderTextColor={brand.textMuted} />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Địa chỉ giao hàng</Text>
                <TextInput
                  style={styles.input}
                  value={form.address}
                  onChangeText={setField('address')}
                  placeholder="Số nhà, đường, phường/xã..."
                  placeholderTextColor={brand.textMuted}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Ghi chú</Text>
                <TextInput
                  style={styles.input}
                  value={form.note}
                  onChangeText={setField('note')}
                  placeholder="Thời gian giao hàng mong muốn..."
                  placeholderTextColor={brand.textMuted}
                />
              </View>

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Tổng cộng</Text>
                <Text style={styles.totalValue}>{formatVnd(totalPrice)}đ</Text>
              </View>

              <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
                <Text style={styles.checkoutBtnText}>{submitting ? 'Đang đặt hàng...' : 'Xác nhận đặt hàng'}</Text>
              </TouchableOpacity>
            </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  flex: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', gap: 8 },
  emptyText: { color: brand.textMuted, fontFamily: fonts.bodyBold, fontSize: 15 },
  list: { padding: 16, gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#0F172A' },
  unitPrice: { fontFamily: fonts.monoBold, fontSize: 13, color: brand.primary, marginTop: 2 },
  
  // ── Qty controls ──
  qtyControls: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9',
    borderRadius: 9, borderWidth: 1, borderColor: '#E2E8F0', padding: 2,
  },
  qtyControlsCompact: {
    padding: 1,
  },
  qtyBtn: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: '#0F172A',
    alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnCompact: {
    width: 24, height: 24, borderRadius: 5,
  },
  qtyBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  qtyBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: fonts.bodyBold, lineHeight: 18 },
  qtyBtnTextCompact: { fontSize: 14, lineHeight: 16 },
  qtyInput: {
    minWidth: 36, maxWidth: 50, height: 28, textAlign: 'center',
    fontFamily: fonts.bodyBold, fontSize: 14.5, color: '#0F172A',
    paddingHorizontal: 4, paddingVertical: 0,
  },
  qtyInputCompact: {
    minWidth: 32, maxWidth: 44, height: 24, fontSize: 13.5,
  },

  removeBtn: { padding: 4 },
  removeText: { color: '#EF4444', fontFamily: fonts.bodyBold, fontSize: 13.5 },
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: '#0F172A' },
  totalValue: { fontFamily: fonts.monoBold, fontSize: 20, color: brand.primary },
  checkoutBtn: { backgroundColor: brand.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  checkoutBtnText: { color: '#FFFFFF', fontFamily: fonts.displayBold, fontSize: 17 },

  modalRoot: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: { fontFamily: fonts.displayBold, fontSize: 18, color: '#0F172A' },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#ef4444', fontSize: 15, fontWeight: '700' },
  modalBody: { padding: 16, gap: 12 },

  orderSummarySection: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 12, padding: 12, gap: 10,
  },
  sectionTitle: { fontFamily: fonts.displayBold, fontSize: 14.5, color: '#0F172A' },
  modalItemRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9', paddingTop: 8,
  },
  modalItemInfo: { flex: 1, minWidth: 0 },
  modalItemName: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: '#0F172A' },
  modalItemPrice: { fontFamily: fonts.monoBold, fontSize: 13, color: brand.primary, marginTop: 1 },

  field: { gap: 6 },
  fieldLabel: { fontFamily: fonts.bodyBold, fontSize: 13.5, color: '#0F172A' },
  input: {
    paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: '#CBD5E1',
    borderRadius: 10, backgroundColor: '#FFFFFF', fontSize: 15, color: '#0F172A', fontFamily: fonts.body,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 14, marginTop: 4,
  },
  submitBtn: { backgroundColor: brand.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
})
