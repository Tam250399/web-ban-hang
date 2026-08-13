import { StyleSheet, Text, TextInput, View } from 'react-native'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

// Input tiền VNĐ: hiển thị số đã format dấu chấm ngăn cách hàng nghìn + hậu tố
// "đ", nhưng vẫn phát ra onChangeValue với chuỗi số thô (không dấu chấm) —
// tương đương MoneyInput.jsx bên web.
export default function MoneyField({ value, onChangeValue, style, ...rest }) {
  const display = value === '' || value === null || value === undefined
    ? ''
    : Number(value).toLocaleString('vi-VN')

  const handleChange = (text) => {
    const raw = text.replace(/\D/g, '')
    onChangeValue(raw)
  }

  return (
    <View style={[styles.wrap, style]}>
      <TextInput
        style={styles.input}
        inputMode="numeric"
        keyboardType="numeric"
        value={display}
        onChangeText={handleChange}
        placeholderTextColor={admin.textMuted}
        {...rest}
      />
      <Text style={styles.suffix}>đ</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', height: 44,
    borderWidth: 1, borderColor: admin.border, borderRadius: 8, backgroundColor: admin.card,
    paddingRight: 12,
  },
  input: {
    flex: 1, height: '100%', paddingHorizontal: 12, paddingVertical: 0,
    fontSize: 13, color: admin.text, fontFamily: fonts.adminBody,
  },
  suffix: { fontFamily: fonts.adminBodySemiBold, fontSize: 12.5, color: admin.textMuted },
})
