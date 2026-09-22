import React from 'react'
import { Feather } from '@expo/vector-icons'

/**
 * Component EyeIcon
 */
export function EyeIcon({ size = 18, color = '#5C5648', style, ...props }) {
  return <Feather name="eye" size={size} color={color} style={style} {...props} />
}

/**
 * Component EyeOffIcon
 */
export function EyeOffIcon({ size = 18, color = '#5C5648', style, ...props }) {
  return <Feather name="eye-off" size={size} color={color} style={style} {...props} />
}

/**
 * Component HomeIcon
 */
export function HomeIcon({ size = 24, color = '#0F172A', style, ...props }) {
  return <Feather name="home" size={size} color={color} style={style} {...props} />
}

/**
 * Component OrdersIcon
 */
export function OrdersIcon({ size = 24, color = '#0F172A', style, ...props }) {
  return <Feather name="file-text" size={size} color={color} style={style} {...props} />
}

/**
 * Component ChatIcon
 */
export function ChatIcon({ size = 24, color = '#0F172A', style, ...props }) {
  return <Feather name="message-square" size={size} color={color} style={style} {...props} />
}

/**
 * Component CartIcon
 */
export function CartIcon({ size = 24, color = '#0F172A', style, ...props }) {
  return <Feather name="shopping-cart" size={size} color={color} style={style} {...props} />
}

/**
 * Component AccountIcon
 */
export function AccountIcon({ size = 24, color = '#0F172A', style, ...props }) {
  return <Feather name="user" size={size} color={color} style={style} {...props} />
}

/**
 * Component ExportIcon
 */
export function ExportIcon({ size = 24, color = '#0F172A', style, ...props }) {
  return <Feather name="upload" size={size} color={color} style={style} {...props} />
}

/**
 * Component BellIcon
 */
export function BellIcon({ size = 24, color = '#0F172A', style, ...props }) {
  return <Feather name="bell" size={size} color={color} style={style} {...props} />
}
