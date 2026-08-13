import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

// Ô bấm mở SearchableSelectModal — thay cho <select> HTML không tồn tại trên RN.
export default function PickerField({ label, placeholder, onPress, style }) {
  return (
    <TouchableOpacity style={[styles.box, style]} onPress={onPress}>
      <Text style={label ? styles.value : styles.placeholder}>{label || placeholder}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  box: {
    paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: admin.border,
    borderRadius: 8, backgroundColor: admin.card,
  },
  value: { fontFamily: fonts.adminBody, fontSize: 13, color: admin.text },
  placeholder: { fontFamily: fonts.adminBody, fontSize: 13, color: admin.textMuted },
})
