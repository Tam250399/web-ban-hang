import {
  LuPencil,
  LuTrash2,
  LuPlus,
  LuX,
  LuRefreshCw,
  LuSearch,
  LuEye,
  LuEyeOff,
  LuCheck,
  LuCircleCheck,
  LuTriangleAlert,
  LuSend,
  LuInfo,
  LuLogOut,
  LuShoppingCart,
  LuPackage,
  LuPackagePlus,
  LuPackageMinus,
  LuTruck,
  LuTag,
  LuBanknote,
  LuChartColumn,
  LuTrophy,
  LuClipboardList,
  LuUsers,
  LuPhone,
  LuMail,
  LuMessageSquare,
  LuBell,
  LuMapPin,
  LuClock,
  LuImage,
  LuCamera,
  LuFile,
  LuFileText,
  LuPaperclip,
  LuSettings,
  LuKey,
  LuLock,
  LuBrickWall,
  LuPickaxe,
  LuZap,
  LuWarehouse,
  LuDoorOpen,
  LuPalette,
  LuRuler,
  LuStore,
  LuHouse,
  LuUser,
  LuReceipt,
  LuCalendar,
  LuInbox,
  LuChevronDown,
  LuChevronUp,
} from 'react-icons/lu'
import { GiConcreteBag } from 'react-icons/gi'
import { MdRoofing } from 'react-icons/md'

export const ICON_MAP = {
  // Thao tác / Hệ thống
  edit: LuPencil,
  trash: LuTrash2,
  plus: LuPlus,
  close: LuX,
  refresh: LuRefreshCw,
  search: LuSearch,
  eye: LuEye,
  eyeOff: LuEyeOff,
  check: LuCheck,
  checkRing: LuCircleCheck,
  alert: LuTriangleAlert,
  send: LuSend,
  info: LuInfo,
  logout: LuLogOut,
  chevronDown: LuChevronDown,
  chevronUp: LuChevronUp,

  // Thương mại / Bán hàng / Kho
  cart: LuShoppingCart,
  box: LuPackage,
  importBox: LuPackagePlus,
  exportBox: LuPackageMinus,
  truck: LuTruck,
  tag: LuTag,
  money: LuBanknote,
  chart: LuChartColumn,
  trophy: LuTrophy,
  clipboard: LuClipboardList,

  // Giao tiếp / Liên hệ
  users: LuUsers,
  phone: LuPhone,
  mail: LuMail,
  chat: LuMessageSquare,
  bell: LuBell,
  pin: LuMapPin,
  clock: LuClock,

  // Tệp tin / Đa phương tiện
  image: LuImage,
  camera: LuCamera,
  file: LuFile,
  note: LuFileText,
  paperclip: LuPaperclip,

  // Cấu hình / Bảo mật
  settings: LuSettings,
  key: LuKey,
  lock: LuLock,

  // Danh mục vật liệu & Xây dựng
  cement: GiConcreteBag,
  brick: LuBrickWall,
  pickaxe: LuPickaxe,
  bolt: LuZap,
  roof: MdRoofing,
  door: LuDoorOpen,
  palette: LuPalette,
  ruler: LuRuler,
  store: LuStore,
  home: LuHouse,
  user: LuUser,
  receipt: LuReceipt,
  calendar: LuCalendar,
  inbox: LuInbox,
}

/**
 * Component hiển thị icon sử dụng thư viện React Icons
 * @param {string} [name] - Tên icon trong danh mục (ví dụ 'cart', 'edit', 'trash'...)
 * @param {React.ComponentType} [icon] - Component React Icon trực tiếp (ví dụ LuShoppingCart...)
 * @param {number|string} [size=18] - Kích thước icon (px)
 * @param {string} [title] - Tiêu đề tooltip / trợ năng
 * @param {string} [className] - Class CSS bổ sung
 * @param {object} [style] - Inline style
 */
export function Icon({ name, icon: DirectIcon, size = 18, title, className = '', style, ...props }) {
  const Component = DirectIcon || (name ? ICON_MAP[name] : null)
  if (!Component) return null

  return (
    <Component
      className={`icon ${className}`.trim()}
      size={size}
      style={style}
      title={title}
      aria-hidden={title ? undefined : 'true'}
      role={title ? 'img' : undefined}
      focusable="false"
      {...props}
    />
  )
}

export default Icon
