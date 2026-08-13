import { useState } from 'react'
import { Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import Toast from 'react-native-toast-message'
import { customerService } from '../../services/customerService'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

const EMPTY_FORM = { fullName: '', phoneNumber: '', address: '', isBusiness: false }

export default function CustomerFormModal({ visible, customer, onClose, onSaved }) {
  const isEdit = !!customer
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Nạp lại form mỗi khi modal mở với dữ liệu customer khác (hoặc mở form thêm mới).
  const resetForNext = (nextCustomer) => {
    setForm(nextCustomer ? {
      fullName: nextCustomer.fullName,
      phoneNumber: nextCustomer.phoneNumber,
      address: nextCustomer.address || '',
      isBusiness: !!nextCustomer.isBusiness,
    } : EMPTY_FORM)
  }

  const handleShow = () => resetForNext(customer)

  const setField = (key) => (value) => setForm((f) => ({ ...f, [key]: value }))

  const handleSubmit = async () => {
    if (!form.fullName.trim() || !form.phoneNumber.trim()) {
      Toast.show({ type: 'error', text1: 'Vui lòng nhập họ tên và số điện thoại' })
      return
    }
    setSaving(true)
    try {
      if (isEdit) {
        await customerService.update(customer.id, form)
        Toast.show({ type: 'success', text1: 'Cập nhật khách hàng thành công!' })
      } else {
        await customerService.create(form)
        Toast.show({ type: 'success', text1: 'Thêm khách hàng thành công!' })
      }
      onSaved()
    } catch (err) {
      Toast.show({ type: 'error', text1: err.message || 'Có lỗi xảy ra' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} onShow={handleShow}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <Text style={styles.title}>{isEdit ? 'Chỉnh sửa khách hàng' : 'Thêm khách hàng mới'}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>{form.isBusiness ? 'Doanh nghiệp' : 'Cá nhân'}</Text>
              <Switch
                value={form.isBusiness}
                onValueChange={setField('isBusiness')}
                trackColor={{ false: admin.border, true: admin.primary }}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Họ tên *</Text>
              <TextInput
                style={styles.input}
                value={form.fullName}
                onChangeText={setField('fullName')}
                placeholder="Nhập họ tên khách hàng..."
                placeholderTextColor={admin.textMuted}
                autoFocus
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Số điện thoại *</Text>
              <TextInput
                style={styles.input}
                value={form.phoneNumber}
                onChangeText={setField('phoneNumber')}
                placeholder="VD: 0901234567"
                placeholderTextColor={admin.textMuted}
                keyboardType="phone-pad"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Nơi ở</Text>
              <TextInput
                style={styles.input}
                value={form.address}
                onChangeText={setField('address')}
                placeholder="Địa chỉ..."
                placeholderTextColor={admin.textMuted}
              />
            </View>

            <View style={styles.actions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : isEdit ? 'Lưu thay đổi' : 'Thêm khách hàng'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: admin.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: admin.divider,
  },
  title: { fontFamily: fonts.adminDisplayBold, fontSize: 16, color: admin.text },
  closeBtn: { width: 28, height: 28, borderRadius: 7, backgroundColor: admin.card, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: admin.text, fontSize: 13 },
  body: { padding: 16, gap: 14 },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: admin.card, borderWidth: 1, borderColor: admin.border, borderRadius: 8, padding: 12,
  },
  toggleLabel: { fontFamily: fonts.adminBodySemiBold, fontSize: 13, color: admin.text },
  field: { gap: 6 },
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
