// Một nguồn sự thật duy nhất cho toàn bộ đường dẫn. Rải chuỗi '/dang-nhap'
// khắp nơi là cách nhanh nhất để sau này đổi URL thì sót một chỗ nào đó.
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

// Tab quản trị: `key` là định danh nội bộ đã dùng sẵn trong AdminDashboard,
// `slug` là phần hiện trên URL. Giữ cả hai trong cùng một bảng để không bao giờ
// lệch nhau.
export const ADMIN_TABS = [
  { key: 'list',       slug: 'san-pham',    label: '📋 Sản phẩm' },
  { key: 'orders',     slug: 'don-hang',    label: '🛒 Đơn hàng' },
  { key: 'stock',      slug: 'kho',         label: '📦 Nhập/Xuất kho' },
  { key: 'customers',  slug: 'khach-hang',  label: '👥 Khách hàng' },
  { key: 'categories', slug: 'danh-muc',    label: '🏷️ Danh mục' },
  { key: 'banners',    slug: 'banner',      label: '🖼️ Banner' },
  { key: 'contact',    slug: 'lien-he',     label: '📞 Liên hệ' },
  { key: 'chat',       slug: 'chat',        label: '💬 Chat' },
  { key: 'stats',      slug: 'thong-ke',    label: '📊 Thống kê' },
  { key: 'system',     slug: 'he-thong',    label: '⚙️ Hệ thống' },
]

// Nhóm menu cha/con cho sidebar — chỉ ảnh hưởng cách hiển thị, không đụng tới
// key/slug dùng cho routing ở trên. Tab nào không nằm trong nhóm nào thì vẫn
// hiện rời như cũ (Chat, Thống kê, Hệ thống — mỗi thứ chỉ có 1 mục nên gom vào
// nhóm chỉ tổ dài dòng thêm một cấp bấm).
export const SIDEBAR_GROUPS = [
  { key: 'sales',   label: '🏪 Bán hàng', tabKeys: ['list', 'orders', 'stock', 'customers'] },
  { key: 'content', label: '🎨 Trang chủ', tabKeys: ['categories', 'banners', 'contact'] },
]

export const DEFAULT_ADMIN_TAB = ADMIN_TABS[0]

/** Tab quản lý đơn hàng online — nơi Admin được đưa tới thay cho "Đơn hàng của tôi". */
export const ADMIN_ORDERS_TAB = ADMIN_TABS.find((t) => t.key === 'orders')

export const adminTabBySlug = (slug) => ADMIN_TABS.find((t) => t.slug === slug)
