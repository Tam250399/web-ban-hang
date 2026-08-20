import { StyleSheet, Text, TextInput, View } from 'react-native'
import { fonts } from '../../theme/fonts'

export default function FormField({ label, error, rightElement, style, ...inputProps }) {
  return (
    <View style={[styles.field, style]}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputWrap}>
        <TextInput
          style={[styles.input, rightElement && styles.inputWithRight, error && styles.inputError]}
          placeholderTextColor="#94A3B8"
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
    fontSize: 13.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    color: '#0F172A',
    fontFamily: fonts.bodyBold,
  },
  inputWrap: { position: 'relative', justifyContent: 'center' },
  input: {
    width: '100%',
    height: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    fontSize: 15,
    color: '#0F172A',
    fontFamily: fonts.body,
  },
  inputWithRight: { paddingRight: 42 },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 13, fontFamily: fonts.body, marginTop: 2 },
})
