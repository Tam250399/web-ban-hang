export const PATHS = {
  home: '/',
  productDetail: (id) => `/san-pham/${id}`,
  productDetailPattern: 'san-pham/:productId',
  login: '/dang-nhap',
  register: '/dang-ky',
  myOrders: '/don-hang-cua-toi',
  admin: '/quan-tri',
  adminTab: (slug) => `/quan-tri/${slug}`,
}

export const ADMIN_TABS = [
  { key: 'list',       slug: 'san-pham',    icon: 'clipboard', label: 'Sản phẩm' },
  { key: 'orders',     slug: 'don-hang',    icon: 'cart',      label: 'Đơn hàng' },
  { key: 'stock',      slug: 'kho',         icon: 'box',       label: 'Nhập/Xuất kho' },
  { key: 'customers',  slug: 'khach-hang',  icon: 'users',     label: 'Khách hàng' },
  { key: 'categories', slug: 'danh-muc',    icon: 'tag',       label: 'Danh mục' },
  { key: 'banners',    slug: 'banner',      icon: 'image',     label: 'Banner' },
  { key: 'contact',    slug: 'lien-he',     icon: 'phone',     label: 'Liên hệ' },
  { key: 'chat',       slug: 'chat',        icon: 'chat',      label: 'Chat' },
  { key: 'stats',      slug: 'thong-ke',    icon: 'chart',     label: 'Thống kê' },
  { key: 'system',     slug: 'he-thong',    icon: 'settings',  label: 'Hệ thống' },
]

export const SIDEBAR_GROUPS = [
  { key: 'sales',   icon: 'store',   label: 'Bán hàng', tabKeys: ['list', 'orders', 'stock', 'customers'] },
  { key: 'content', icon: 'palette', label: 'Trang chủ', tabKeys: ['categories', 'banners', 'contact'] },
]

export const DEFAULT_ADMIN_TAB = ADMIN_TABS[0]

export const ADMIN_ORDERS_TAB = ADMIN_TABS.find((t) => t.key === 'orders')

export const adminTabBySlug = (slug) => ADMIN_TABS.find((t) => t.slug === slug)
