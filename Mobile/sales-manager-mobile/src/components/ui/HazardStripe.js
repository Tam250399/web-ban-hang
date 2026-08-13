import Svg, { Defs, Pattern, Rect } from 'react-native-svg'
import { brand } from '../../theme/colors'

// Sọc chéo vàng/đen thương hiệu — tương đương .hzd bên web
// (repeating-linear-gradient(135deg, #F2B705 0 14px, #1F1D1A 14px 28px)).
export default function HazardStripe({ height = 8 }) {
  return (
    <Svg width="100%" height={height}>
      <Defs>
        <Pattern id="hzd" patternUnits="userSpaceOnUse" width={28} height={28} patternTransform="rotate(45)">
          <Rect x={0} y={0} width={14} height={28} fill={brand.accent} />
          <Rect x={14} y={0} width={14} height={28} fill={brand.ink} />
        </Pattern>
      </Defs>
      <Rect x={0} y={0} width="100%" height={height} fill="url(#hzd)" />
    </Svg>
  )
}
