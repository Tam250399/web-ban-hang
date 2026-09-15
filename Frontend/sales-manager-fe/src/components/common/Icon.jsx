
const P = {
  edit:      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3Z M13.5 6.5l4 4" />,
  trash:     <path d="M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v6 M14 11v6" />,
  plus:      <path d="M12 5v14 M5 12h14" />,
  close:     <path d="M6 6l12 12 M18 6 6 18" />,
  refresh:   <path d="M20 12a8 8 0 1 1-2.3-5.6 M20 4v4h-4" />,
  search:    <path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z M16.5 16.5 21 21" />,
  eye:       <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6Z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />,
  check:     <path d="M20 6 9 17l-5-5" />,
  checkRing: <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M8 12l3 3 5-5" />,
  alert:     <path d="M12 3 2 20h20L12 3Z M12 9v5 M12 17.5v.5" />,
  send:      <path d="M21 3 3 10.5l7 3 3 7L21 3Z" />,
  info:      <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 11v6 M12 7.5v.01" />,
  logout:    <path d="M10 4H5v16h5 M15 8l4 4-4 4 M19 12H9" />,

  cart:      <path d="M3 4h2l2.2 11h11L21 7H6 M10 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z M17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
  box:       <path d="M3 8 12 3l9 5v8l-9 5-9-5V8Z M3 8l9 5 9-5 M12 13v10" />,
  importBox: <path d="M12 3v9 M8.5 8.5 12 12l3.5-3.5 M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />,
  exportBox: <path d="M12 12V3 M8.5 6.5 12 3l3.5 3.5 M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />,
  truck:     <path d="M3 6h11v10H3V6Z M14 9h4l3 3v4h-7V9Z M7.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z" />,
  tag:       <path d="M3 12V4h8l10 10-8 8L3 12Z M7.5 7.5v.01" />,
  money:     <path d="M2 6h20v12H2V6Z M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z M5.5 9.5v.01 M18.5 14.5v.01" />,
  chart:     <path d="M4 20V10 M10 20V4 M16 20v-7 M22 20H2" />,
  trophy:    <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z M7 6H4v2a3 3 0 0 0 3 3 M17 6h3v2a3 3 0 0 1-3 3 M10 19h4 M12 14v5" />,
  clipboard: <path d="M9 4h6v3H9V4Z M9 5.5H6v15h12v-15h-3 M9 12h6 M9 16h4" />,

  users:     <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z M2.5 20a6.5 6.5 0 0 1 13 0 M17 11.5a3 3 0 1 0 0-6 M18 14.2a6 6 0 0 1 3.5 5.3" />,
  phone:     <path d="M6 3h3l1.5 5-2 1.5a12 12 0 0 0 6 6L16 13.5 21 15v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4 5.2 2 2 0 0 1 6 3Z" />,
  mail:      <path d="M3 5h18v14H3V5Z M3 6l9 7 9-7" />,
  chat:      <path d="M4 4h16v12H8l-4 4V4Z M8 9h8 M8 12.5h5" />,
  bell:      <path d="M12 3a6 6 0 0 0-6 6c0 4-2 5-2 5h16s-2-1-2-5a6 6 0 0 0-6-6Z M10.5 20.5a2 2 0 0 0 3 0" />,
  pin:       <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z M12 7.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />,
  clock:     <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z M12 7v5.2l3.5 2" />,

  image:     <path d="M3 5h18v14H3V5Z M8.5 10.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z M3 16l5-4 4 3 3-2.5 6 4.5" />,
  camera:    <path d="M3 7h4l1.5-2.5h7L17 7h4v13H3V7Z M12 16.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />,
  file:      <path d="M14 3H6v18h12V7l-4-4Z M14 3v4h4" />,
  note:      <path d="M6 3h12v18H6V3Z M9.5 8h5 M9.5 12h5 M9.5 16h3" />,
  paperclip: <path d="M20 11.5 12 19.5a5 5 0 0 1-7-7l8-8a3.5 3.5 0 0 1 5 5l-8 8a2 2 0 0 1-3-3l7.5-7.5" />,

  settings:  <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z M19.5 12a7.5 7.5 0 0 0-.15-1.5l2-1.5-2-3.5-2.4 1a7.5 7.5 0 0 0-2.6-1.5L14 2h-4l-.35 2.5a7.5 7.5 0 0 0-2.6 1.5l-2.4-1-2 3.5 2 1.5a7.6 7.6 0 0 0 0 3l-2 1.5 2 3.5 2.4-1a7.5 7.5 0 0 0 2.6 1.5L10 22h4l.35-2.5a7.5 7.5 0 0 0 2.6-1.5l2.4 1 2-3.5-2-1.5c.1-.5.15-1 .15-1.5Z" />,
  key:       <path d="M15 3a6 6 0 1 0-4.2 10.2L4 20v1h4v-2h2v-2h2l1.8-1.8A6 6 0 0 0 15 3Z M16.5 7.5v.01" />,
  lock:      <path d="M6 11h12v10H6V11Z M8.5 11V7.5a3.5 3.5 0 0 1 7 0V11" />,

  cement:    <path d="M3 21h18 M6 21V9l7-5v17 M13 9h6v12 M16 13v.01 M16 17v.01" />,
  brick:     <path d="M3 6h18v5H3V6Z M3 13h18v5H3v-5Z M9 6v5 M15 6v5 M6 13v5 M12 13v5 M18 13v5" />,
  pickaxe:   <path d="M3 21 14 10 M4 9a11 11 0 0 1 15 0 M11.5 3.5a11 11 0 0 1 0 12 M12.5 8.5l3.5 3.5" />,
  bolt:      <path d="M9.5 4h5l1.5 3-1.5 3h-5L8 7l1.5-3Z M12 10v10 M9.5 13.5h5 M9.5 17h5" />,
  roof:      <path d="M2 12 12 4l10 8 M5 11v9h14v-9 M9.5 20v-5h5v5" />,
  door:      <path d="M5 3h14v18H5V3Z M15.5 12v.01" />,
  palette:   <path d="M12 3a9 9 0 0 0 0 18c1.4 0 1.8-1 1.2-1.8-.7-.9-.3-2.2 1-2.2H17a4 4 0 0 0 4-4c0-5-4-10-9-10Z M7.5 11v.01 M10 7.5v.01 M14.5 7.5v.01" />,
  ruler:     <path d="m3 16 13-13 5 5-13 13-5-5Z M7 12l2 2 M10 9l2 2 M13 6l2 2" />,
  store:     <path d="M4 4h16l1 5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0l1-5Z M5 12v8h14v-8 M9.5 20v-5h5v5" />,
  home:      <path d="M3 11 12 4l9 7 M5.5 9.8V20h13V9.8 M10 20v-5h4v5" />,
  user:      <path d="M12 11.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21a8 8 0 0 1 16 0" />,
  receipt:   <path d="M5 3h14v18l-2.3-1.6-2.4 1.6-2.3-1.6-2.4 1.6L7.3 19.4 5 21V3Z M9 8h6 M9 12h6" />,
  calendar:  <path d="M4 6h16v15H4V6Z M4 10.5h16 M8 3v4 M16 3v4" />,
  inbox:     <path d="M3 13h5l1.5 3h5l1.5-3h5 M3 13 5.5 5h13L21 13v7H3v-7Z" />,
}

export function Icon({ name, size = 18, title, className = '', style }) {
  const path = P[name]
  if (!path) return null

  return (
    <svg
      className={`icon ${className}`.trim()}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : 'true'}
      focusable="false"
    >
      {title ? <title>{title}</title> : null}
      {path}
    </svg>
  )
}
