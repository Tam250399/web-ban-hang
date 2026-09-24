import React from 'react'
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'
import { brand } from '../../theme/colors'

export const ICON_MAP = {
  // Thao tác / Hệ thống
  edit:        { Family: Feather, name: 'edit-2' },
  trash:       { Family: Feather, name: 'trash-2' },
  plus:        { Family: Feather, name: 'plus' },
  close:       { Family: Feather, name: 'x' },
  refresh:     { Family: Feather, name: 'refresh-cw' },
  search:      { Family: Feather, name: 'search' },
  eye:         { Family: Feather, name: 'eye' },
  eyeOff:      { Family: Feather, name: 'eye-off' },
  check:       { Family: Feather, name: 'check' },
  checkRing:   { Family: Feather, name: 'check-circle' },
  alert:       { Family: Feather, name: 'alert-triangle' },
  send:        { Family: Feather, name: 'send' },
  info:        { Family: Feather, name: 'info' },
  logout:      { Family: Feather, name: 'log-out' },
  chevronDown: { Family: Feather, name: 'chevron-down' },
  chevronUp:   { Family: Feather, name: 'chevron-up' },

  // Thương mại / Bán hàng / Kho
  cart:        { Family: Feather, name: 'shopping-cart' },
  box:         { Family: Feather, name: 'package' },
  importBox:   { Family: MaterialCommunityIcons, name: 'package-down' },
  exportBox:   { Family: MaterialCommunityIcons, name: 'package-up' },
  truck:       { Family: Feather, name: 'truck' },
  tag:         { Family: Feather, name: 'tag' },
  money:       { Family: MaterialCommunityIcons, name: 'cash-multiple' },
  chart:       { Family: Feather, name: 'bar-chart-2' },
  trophy:      { Family: Feather, name: 'award' },
  clipboard:   { Family: Feather, name: 'clipboard' },

  // Giao tiếp / Liên hệ
  users:       { Family: Feather, name: 'users' },
  phone:       { Family: Feather, name: 'phone' },
  mail:        { Family: Feather, name: 'mail' },
  chat:        { Family: Feather, name: 'message-square' },
  bell:        { Family: Feather, name: 'bell' },
  pin:         { Family: Feather, name: 'map-pin' },
  clock:       { Family: Feather, name: 'clock' },

  // Tệp tin / Đa phương tiện
  image:       { Family: Feather, name: 'image' },
  camera:      { Family: Feather, name: 'camera' },
  file:        { Family: Feather, name: 'file' },
  note:        { Family: Feather, name: 'file-text' },
  paperclip:   { Family: Feather, name: 'paperclip' },

  // Cấu hình / Bảo mật
  settings:    { Family: Feather, name: 'settings' },
  key:         { Family: Feather, name: 'key' },
  lock:        { Family: Feather, name: 'lock' },
  shield:      { Family: Feather, name: 'shield' },

  // Mạng xã hội / OAuth
  google:      { Family: FontAwesome, name: 'google' },
  facebook:    { Family: FontAwesome, name: 'facebook-square' },

  // Danh mục vật liệu & Xây dựng
  cement:      { Family: MaterialCommunityIcons, name: 'sack-outline' },
  brick:       { Family: MaterialCommunityIcons, name: 'wall' },
  pickaxe:     { Family: MaterialCommunityIcons, name: 'pickaxe' },
  bolt:        { Family: Feather, name: 'zap' },
  roof:        { Family: MaterialCommunityIcons, name: 'home-roof' },
  door:        { Family: MaterialCommunityIcons, name: 'door-open' },
  palette:     { Family: MaterialCommunityIcons, name: 'palette-outline' },
  ruler:       { Family: MaterialCommunityIcons, name: 'ruler' },
  store:       { Family: MaterialCommunityIcons, name: 'storefront-outline' },
  home:        { Family: Feather, name: 'home' },
  user:        { Family: Feather, name: 'user' },
  receipt:     { Family: MaterialCommunityIcons, name: 'receipt-text-outline' },
  calendar:    { Family: Feather, name: 'calendar' },
  inbox:       { Family: Feather, name: 'inbox' },
}

export const ICON_ROW = { flexDirection: 'row', alignItems: 'center', gap: 7 }

/**
 * Component hiển thị icon sử dụng thư viện @expo/vector-icons
 * @param {string} name - Tên định danh của icon
 * @param {number} [size=18] - Kích thước icon
 * @param {string} [color] - Màu sắc icon
 * @param {string} [label] - Nhãn trợ năng
 * @param {object} [style] - Tùy chỉnh style
 */
export function Icon({ name, size = 18, color = brand.text, label, style, ...props }) {
  const conf = ICON_MAP[name]
  if (!conf) return null

  const { Family, name: iconName } = conf
  return (
    <Family
      name={iconName}
      size={size}
      color={color}
      style={style}
      accessibilityLabel={label}
      accessible={!!label}
      accessibilityRole={label ? 'image' : 'none'}
      {...props}
    />
  )
}

export default Icon
