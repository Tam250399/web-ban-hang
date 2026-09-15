const COLORS = {
  normal: { circle: '#072a4a', mark: '#f3f5f8', bar: '#c26030' },
  reversed: { circle: '#f3f5f8', mark: '#072a4a', bar: '#b2511e' },
}

const ICON_ONLY_TRANSFORM = 'translate(100,100) scale(2.1) translate(-100,-64)'

/**
 * Component logo thương hiệu kèm biểu tượng
 */
export default function LogoBadge({ size = 44, variant = 'normal', showText = size >= 72, className }) {
  const c = COLORS[variant] ?? COLORS.normal
  const mark = (
    <>
      <polygon points="100,44 124,62 118,62 118,84 82,84 82,62 76,62" fill={c.mark} />
      <rect x="82" y="76" width="36" height="5" fill={c.bar} />
    </>
  )

  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} role="img" aria-label="Lý Sáu">
      <circle cx="100" cy="100" r="96" fill={c.circle} />
      <circle cx="100" cy="100" r="86" fill="none" stroke={c.mark} strokeWidth={showText ? 1.5 : 3} />
      {showText ? (
        <>
          {mark}
          <text x="100" y="122" textAnchor="middle" fontFamily="Montserrat, sans-serif" fontWeight="800" fontSize="21" fill={c.mark} letterSpacing="1">LÝ SÁU</text>
        </>
      ) : (
        <g transform={ICON_ONLY_TRANSFORM}>{mark}</g>
      )}
    </svg>
  )
}
