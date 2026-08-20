import { StyleSheet, Text, View } from 'react-native'
import { brand } from '../../theme/colors'
import { fonts } from '../../theme/fonts'

// Chip "Lý Sáu" xoay nhẹ -2deg, xuất hiện ở đầu mọi card thương hiệu trong thiết kế.
export default function BrandTag({ label = 'Lý Sáu', style, textStyle }) {
  return (
    <View style={[styles.chip, style]}>
      <Text style={[styles.text, textStyle]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    backgroundColor: brand.accent,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    transform: [{ rotate: '-2deg' }],
  },
  text: {
    color: brand.ink,
    fontFamily: fonts.monoBold,
    fontSize: 12.5,
    letterSpacing: 0.4,
  },
})
