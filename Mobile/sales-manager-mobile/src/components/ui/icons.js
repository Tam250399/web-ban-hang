import Svg, { Circle, Line, Path } from 'react-native-svg'

// Chuyển thẳng từ EyeIcon/EyeOffIcon trong Login.jsx (web) sang react-native-svg.
export function EyeIcon({ size = 18, color = '#5C5648' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke={color} strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    </Svg>
  )
}

export function EyeOffIcon({ size = 18, color = '#5C5648' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" stroke={color} strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
      <Line x1={3} y1={21} x2={21} y2={3} stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  )
}
