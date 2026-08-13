import { useState } from 'react'
import { FlatList, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Toast from 'react-native-toast-message'
import { useCart } from '../context/cart-context'
import { useAuth } from '../context/auth-context'
import { orderService } from '../services/orderService'
import { brand } from '../theme/colors'
import { fonts } from '../theme/fonts'

function formatVnd(value) {
  return Number(value ?? 0).toLocaleString('vi-VN')
}

// Chưa có thiết kế riêng cho giỏ hàng — dùng UI tối giản dựa trên tông màu
// thương hiệu, chức năng lấy thẳng từ CartContext đã có sẵn.
export default function CartScreen() {
  const navigation = useNavigation()
  const { items, updateQuantity, removeItem, clear, totalPrice } = useCart()
  const { user, isGuest } = useAuth()
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
    setSubmitting(true)
    try {
      await orderService.create({
        recipientName: form.recipientName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        address: form.address.trim() || null,
        note: form.note.trim() || null,
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      })
      Toast.show({ type: 'success', text1: 'Đặt hàng thành công! Chúng tôi sẽ liên hệ xác nhận sớm.' })
      clear()
      setCheckoutOpen(false)
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message || 'Đặt hàng thất bại.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (items.length === 0) {
    return (
      <SafeAreaView style={styles.empty} edges={['top']}>
        <Text style={styles.emptyIcon}>🛒</Text>
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
            <View style={styles.qtyControls}>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qty}>{item.quantity}</Text>
              <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity onPress={() => removeItem(item.productId)}>
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
        {/* Modal gốc của RN dựng cây view native riêng nên SafeAreaView bên trong
            không tự lấy được inset đúng — phải bọc thêm SafeAreaProvider mới ở đây. */}
        <SafeAreaProvider>
          <SafeAreaView style={styles.modalRoot} edges={['top', 'bottom']}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thông tin giao hàng</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setCheckoutOpen(false)}>
                <Text style={styles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalBody}>
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
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: brand.textMuted, fontFamily: fonts.bodyBold, fontSize: 14 },
  list: { padding: 16, gap: 12 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0',
    borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#0F172A' },
  unitPrice: { fontFamily: fonts.monoBold, fontSize: 12, color: brand.primary, marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: '#FFFFFF', fontSize: 16, fontFamily: fonts.bodyBold, lineHeight: 18 },
  qty: { minWidth: 20, textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 14, color: '#0F172A' },
  removeText: { color: '#EF4444', fontFamily: fonts.bodyBold, fontSize: 12.5 },
  footer: { padding: 16, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', gap: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontFamily: fonts.bodyBold, fontSize: 14, color: '#0F172A' },
  totalValue: { fontFamily: fonts.monoBold, fontSize: 20, color: brand.primary },
  checkoutBtn: { backgroundColor: brand.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  checkoutBtnText: { color: '#FFFFFF', fontFamily: fonts.displayBold, fontSize: 16 },

  modalRoot: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: { fontFamily: fonts.displayBold, fontSize: 17, color: '#0F172A' },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#ef4444', fontSize: 14, fontWeight: '700' },
  modalBody: { padding: 16, gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fonts.bodyBold, fontSize: 12.5, color: '#0F172A' },
  input: {
    paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, borderColor: '#CBD5E1',
    borderRadius: 10, backgroundColor: '#FFFFFF', fontSize: 14, color: '#0F172A', fontFamily: fonts.body,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    borderTopWidth: 1, borderTopColor: '#E2E8F0', paddingTop: 14, marginTop: 4,
  },
  submitBtn: { backgroundColor: brand.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
})
