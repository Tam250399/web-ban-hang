import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { admin } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

/**
 * Component PickerField
 */
export default function PickerField({ label, placeholder, onPress, style, textStyle }) {
  return (
    <TouchableOpacity style={[styles.box, style]} onPress={onPress} activeOpacity={0.7}>
      <Text style={[label ? styles.value : styles.placeholder, textStyle]} numberOfLines={1}>
        {label || placeholder}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  box: {
    height: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: admin.border,
    borderRadius: 8, backgroundColor: admin.card, justifyContent: 'center',
  },
  value: { fontFamily: fonts.adminBody, fontSize: 14, color: admin.text },
  placeholder: { fontFamily: fonts.adminBody, fontSize: 14, color: admin.textMuted },
})
