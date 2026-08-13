import { StyleSheet, Text, TextInput, View } from 'react-native'
import { brand } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

export default function FormField({ label, error, rightElement, style, ...inputProps }) {
  return (
    <View style={[styles.field, style]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, rightElement && styles.inputWithRight, error && styles.inputError]}
          placeholderTextColor={brand.textMuted}
          {...inputProps}
        />
        {rightElement}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  )
}

const styles = StyleSheet.create({
  field: { gap: 6 },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    color: brand.ink,
    fontFamily: fonts.bodyBold,
  },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    width: '100%',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: brand.ink,
    backgroundColor: brand.card,
    fontSize: 14,
    color: brand.ink,
    fontFamily: fonts.body,
  },
  inputWithRight: { paddingRight: 40 },
  inputError: { borderColor: brand.danger },
  errorText: { color: brand.danger, fontSize: 12, fontFamily: fonts.body },
})
