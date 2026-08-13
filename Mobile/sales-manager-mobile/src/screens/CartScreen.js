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
  container: { flex: 1, backgroundColor: brand.bg },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: brand.bg, gap: 8 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: brand.textMuted, fontFamily: fonts.body, fontSize: 14 },
  list: { padding: 16, gap: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: brand.white, borderWidth: 1.5, borderColor: brand.ink,
    borderRadius: 12, padding: 12,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  name: { fontFamily: fonts.bodyBold, fontSize: 13, color: brand.ink },
  unitPrice: { fontFamily: fonts.mono, fontSize: 11, color: brand.textMuted, marginTop: 2 },
  qtyControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 26, height: 26, borderRadius: 6, backgroundColor: brand.ink, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { color: brand.accent, fontSize: 16, fontFamily: fonts.bodyBold, lineHeight: 18 },
  qty: { minWidth: 18, textAlign: 'center', fontFamily: fonts.bodySemiBold, fontSize: 13, color: brand.ink },
  removeText: { color: brand.danger, fontFamily: fonts.bodySemiBold, fontSize: 12 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: brand.card, gap: 10 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  totalLabel: { fontFamily: fonts.body, fontSize: 13, color: brand.textMuted },
  totalValue: { fontFamily: fonts.monoBold, fontSize: 20, color: brand.ink },
  checkoutBtn: { backgroundColor: brand.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  checkoutBtnText: { color: brand.white, fontFamily: fonts.displayExtraBold, fontSize: 16 },

  modalRoot: { flex: 1, backgroundColor: brand.bg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: brand.card,
  },
  modalTitle: { fontFamily: fonts.displayExtraBold, fontSize: 16, color: brand.ink },
  closeBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: brand.card, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: brand.ink, fontSize: 13 },
  modalBody: { padding: 16, gap: 14 },
  field: { gap: 6 },
  fieldLabel: { fontFamily: fonts.bodyBold, fontSize: 11.5, color: brand.ink },
  input: {
    paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1.5, borderColor: brand.ink,
    borderRadius: 10, backgroundColor: brand.card, fontSize: 13.5, color: brand.ink, fontFamily: fonts.body,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline',
    borderTopWidth: 1, borderTopColor: brand.card, paddingTop: 12, marginTop: 4,
  },
  submitBtn: { backgroundColor: brand.primary, borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 6 },
})
