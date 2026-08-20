import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { brand } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

export function PrimaryButton({ title, onPress, loading, disabled, style }) {
  return (
    <TouchableOpacity
      style={[styles.primary, (disabled || loading) && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
    >
      {loading ? <ActivityIndicator color={brand.white} /> : <Text style={styles.primaryText}>{title}</Text>}
    </TouchableOpacity>
  )
}

export function OutlineButton({ title, onPress, style, textStyle, dark }) {
  return (
    <TouchableOpacity
      style={[styles.outline, dark && styles.outlineDark, style]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.outlineText, dark && styles.outlineTextDark, textStyle]}>{title}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: brand.primary,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.6 },
  primaryText: {
    color: brand.white,
    fontFamily: fonts.displayExtraBold,
    fontSize: 17,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: brand.ink,
    borderRadius: 9,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineDark: { borderColor: brand.outlineBorder },
  outlineText: {
    color: brand.ink,
    fontFamily: fonts.displayBold,
    fontSize: 14,
  },
  outlineTextDark: { color: brand.outlineText },
})
