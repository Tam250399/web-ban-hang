import Svg, { Circle, Line, Path } from 'react-native-svg'

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

const STROKE = 1.9

function LineIcon({ size = 24, children }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {children}
    </Svg>
  )
}

export function HomeIcon({ size = 24, color = '#0F172A' }) {
  return (
    <LineIcon size={size}>
      <Path
        d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1v-9.5z"
        stroke={color} strokeWidth={STROKE} strokeLinejoin="round" strokeLinecap="round"
      />
    </LineIcon>
  )
}

export function OrdersIcon({ size = 24, color = '#0F172A' }) {
  return (
    <LineIcon size={size}>
      <Path
        d="M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1z"
        stroke={color} strokeWidth={STROKE} strokeLinejoin="round"
      />
      <Line x1={9} y1={8} x2={15} y2={8} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1={9} y1={12} x2={15} y2={12} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </LineIcon>
  )
}

export function ChatIcon({ size = 24, color = '#0F172A' }) {
  return (
    <LineIcon size={size}>
      <Path
        d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"
        stroke={color} strokeWidth={STROKE} strokeLinejoin="round"
      />
    </LineIcon>
  )
}

export function CartIcon({ size = 24, color = '#0F172A' }) {
  return (
    <LineIcon size={size}>
      <Path
        d="M3 4h2.2l2.3 10.5a1 1 0 0 0 1 .8h8.1a1 1 0 0 0 1-.75L19.5 8H6.2"
        stroke={color} strokeWidth={STROKE} strokeLinejoin="round" strokeLinecap="round"
      />
      <Circle cx={9.5} cy={19} r={1.4} stroke={color} strokeWidth={STROKE} />
      <Circle cx={16.5} cy={19} r={1.4} stroke={color} strokeWidth={STROKE} />
    </LineIcon>
  )
}

export function AccountIcon({ size = 24, color = '#0F172A' }) {
  return (
    <LineIcon size={size}>
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={STROKE} />
      <Path
        d="M4.5 20.5c1.2-3.6 4-5.5 7.5-5.5s6.3 1.9 7.5 5.5"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round"
      />
    </LineIcon>
  )
}

export function ExportIcon({ size = 24, color = '#0F172A' }) {
  return (
    <LineIcon size={size}>
      <Path d="M12 3v11" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Path d="m8 6.5 4-3.5 4 3.5" stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      <Path
        d="M4 14v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5"
        stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round"
      />
    </LineIcon>
  )
}

export function BellIcon({ size = 24, color = '#0F172A' }) {
  return (
    <LineIcon size={size}>
      <Path
        d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 13 6 9z"
        stroke={color} strokeWidth={STROKE} strokeLinejoin="round"
      />
      <Path d="M10 18a2 2 0 0 0 4 0" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </LineIcon>
  )
}
