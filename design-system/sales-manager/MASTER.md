# Hệ thống thiết kế — Cửa Hàng VLXD Lý Sáu

Nguồn sự thật cho màu, chữ, vùng chạm và chuyển động của cả web lẫn app.
Mọi con số tương phản dưới đây đã đo bằng công thức WCAG 2.1, không phải ước lượng.

Ngưỡng áp dụng: **4.5:1** cho chữ thường, **3:1** cho chữ lớn (≥24px, hoặc ≥18.66px in đậm)
và cho viền/biểu tượng mang thông tin.

---

## 1. Ba bảng màu, không phải một

Dự án có **ba** ngữ cảnh màu tách biệt. Nhầm token giữa chúng là lỗi hay gặp nhất.

### 1a. Web — mặt tiền cửa hàng (`:root` trong `Frontend/sales-manager-fe/src/App.css`)

| Token | Mã | Dùng cho | Tương phản đã đo |
|---|---|---|---|
| `--ink` | `#1F1D1A` | Chữ chính, nền hero/footer | — |
| `--text` | `#5C5648` | Chữ thân bài trên nền sáng | 6.07:1 trên `--bg` |
| `--text-light` | `#6F6857` | Chữ phụ **trên nền sáng** | 4.61:1 trên `--bg`, 5.54:1 trên trắng |
| `--hero-muted` | `#B9B2A0` | Chữ phụ **trên nền tối** | 7.96:1 trên `--ink` |
| `--primary` | `#C1440E` | Nút chính, viền focus | 5.12:1 trên trắng |
| `--accent` | `#F2B705` | Điểm nhấn **chỉ trên nền tối** | 9.25:1 trên `--ink`; **1.82:1 trên trắng — cấm dùng** |
| `--success` | `#22c55e` | **Chỉ làm nền** (chấm trạng thái) | 2.28:1 nếu làm chữ — không đạt |
| `--success-text` | `#146C34` | Bản dành cho chữ | 5.42:1 trên `--bg`, 6.51:1 trên trắng |
| `--danger` | `#DC2626` | Lỗi, xoá | 4.83:1 trên trắng |

`--text-light` và `--hero-muted` **không thay thế cho nhau được**. Một mã xám không thể
vừa đủ tương phản trên nền sáng vừa đủ trên nền tối; trước đây cả hai chỗ dùng chung
`#8A8272` nên thất bại ở cả hai đầu (3.17:1 trên nền sáng, 4.42:1 trên nền tối).

### 1b. Web — khu quản trị (`body.admin-theme`, OKLCH)

Class được bật trên `<body>` khi `AdminDashboard` mount, nên panel render qua portal
(dropdown của `SearchableSelect`) cũng nhận được theme.

| Token | OKLCH | ≈ Hex | Tương phản |
|---|---|---|---|
| `--primary` | `0.55 0.17 262` | `#366BD3` | 4.57:1 trên `--bg`; chữ trắng trên nền này 4.98:1 |
| `--text` | `0.5 0.012 255` | `#5F646A` | 5.50:1 trên `--bg` |
| `--text-light` | `0.54 0.012 255` | `#6A6F76` | 4.64:1 trên `--bg` |
| `--success` | `0.6 0.13 152` | `#359658` | 3.41:1 — **chỉ làm nền hoặc chấm** |
| `--success-text` | `0.5 0.13 152` | `#05773B` | 5.18:1 trên `--bg` |
| `--danger` | `0.55 0.19 24` | `#C92F36` | 4.91:1 trên `--bg` |

### 1c. Mobile (`Mobile/sales-manager-mobile/src/theme/colors.js`)

| Token | Mã | Ghi chú |
|---|---|---|
| `brand.text` | `#0F172A` | |
| `brand.textMuted` | `#64748B` | 4.55:1 trên `bg` |
| `brand.textFaint` | `#64748B` | Bằng `textMuted` — dưới mức này không màu nào đạt 4.5:1 trên thẻ trắng. **Phân cấp bằng cỡ chữ và độ đậm, không bằng màu nhạt hơn.** |
| `brand.primary` | `#C2410C` | Nền nút chính với chữ trắng: 5.18:1. Cũng dùng làm chữ trên thẻ trắng (mã danh mục): 5.18:1 |
| `brand.danger` | `#DC2626` | Nền `OfflineBanner` với chữ trắng: 4.83:1 |
| `brand.success` | `#047857` | Dùng làm chữ: 5.48:1 trên trắng |
| `brand.accent` | `#F97316` | **Chỉ ghép với `brand.ink`** (nhãn BrandTag, badge sắp hết hàng, chip đang chọn): 6.37:1. Trên nền trắng chỉ 2.80:1 |
| `admin.primary` | `#2563EB` | 5.17:1 trên trắng |

---

## 2. Chữ

**Sàn 12px (`0.75rem`) cho mọi chữ hiển thị.** Không có ngoại lệ cho nhãn, badge hay
dấu thời gian. Khách của cửa hàng phần lớn lớn tuổi và hay xem giá ngoài nắng — chữ
10-11px trong thực tế là chữ không đọc được, dù trên màn hình thiết kế trông vẫn ổn.

| Ngữ cảnh | Font |
|---|---|
| Web — tiêu đề mặt tiền | Barlow Condensed |
| Web — thân bài | Inter |
| Web — số liệu, mã hàng | IBM Plex Mono |
| Web — khu quản trị | Space Grotesk (tiêu đề) + IBM Plex Sans (thân) |
| Mobile | cùng bộ, khai báo qua alias vai trò trong `src/theme/fonts.js` |

Mobile không viết thẳng tên font vào screen — dùng alias (`fonts.displayBold`,
`fonts.body`, `fonts.adminDisplay`...) để đổi font một chỗ là xong.

---

## 3. Vùng chạm

Tối thiểu **44×44px** trên thiết bị cảm ứng, cách nhau ≥8px.

Web dùng `@media (pointer: coarse)` thay vì breakpoint theo chiều rộng: chuột trên máy
bàn giữ nguyên mật độ cũ, chỉ ngón tay mới được nới ra. Khối này nằm cuối `App.css`.

Mobile: `PrimaryButton` đã đạt ~50px nhờ `paddingVertical: 14`; `OutlineButton` cần
`minHeight: 44` vì chữ 14px + padding 11 chỉ ra ~39px.

Kiểm tra nhanh bằng script trong trình duyệt: quét mọi `button/a/input/select`, lọc
phần tử có `getBoundingClientRect()` nhỏ hơn 44 ở một chiều.

---

## 4. Chuyển động

`prefers-reduced-motion: reduce` rút mọi animation còn `0.01ms` (khối cuối `App.css`).
Giữ `0.01ms` chứ không đặt `none` — code nào đang chờ `transitionend`/`animationend`
vẫn nhận được sự kiện thay vì treo giữa chừng.

---

## 5. Focus bàn phím

`:where(a, button, input, select, textarea, summary, [tabindex]):focus-visible` đặt
viền `2px solid var(--primary)`, khai báo **ở cuối `App.css`** — không phải `index.css`.
Lý do: `index.css` nạp trước, nên các rule `outline: none` cùng độ đặc hiệu trong
`App.css` sẽ thắng nếu đặt nhầm chỗ.

`:focus-visible` chỉ hiện khi thao tác bằng bàn phím nên không làm phiền người bấm chuột.

---

## 6. Biểu tượng

Một bộ đường vẽ, dùng chung hai nền tảng — cùng lưới 24×24, cùng nét 2px:

| Nền tảng | File |
|---|---|
| Web | `Frontend/sales-manager-fe/src/components/common/Icon.jsx` |
| Mobile | `Mobile/sales-manager-mobile/src/components/ui/Icon.js` |

Chuỗi `d` của hai file **giống hệt nhau**. Thêm hoặc sửa một icon thì phải sửa cả hai,
nếu không hai nền tảng sẽ trôi dần khỏi nhau.

```jsx
<Icon name="cart" />                        // web, kế thừa currentColor
<Icon name="cart" size={16} color={...} />  // mobile, màu truyền tay
```

**Không dùng emoji làm biểu tượng.** Emoji đổi hình theo hệ điều hành, luôn tự tô màu
nên không đổi theo trạng thái nút, và chiều cao dòng của chúng lệch với chữ bên cạnh.
Thứ đáng ra là chi tiết thương hiệu thì lại do máy người dùng quyết định.

Ngoại lệ được giữ: ký hiệu văn bản đơn sắc — `✕` (đóng), `←` `→` `↓` (mũi tên),
`▶` `❚❚` (phát/dừng), `➤` (gửi), `−` `＋` (tăng giảm). Chúng ăn theo `currentColor`
như chữ thường và không có vấn đề nào của emoji.

**Căn chỉnh.** Web: `.icon` có `vertical-align: -0.18em` để tâm icon trùng tâm chữ
bên cạnh; `.icon:only-child` chuyển sang `middle` vì icon đứng một mình không có chữ
nào để căn theo. Mobile: dùng hằng `ICON_ROW` xuất từ `Icon.js` thay vì mỗi màn tự
khai một style hàng riêng.

**Máy đọc màn hình.** Icon mặc định bị ẩn (`aria-hidden` / `importantForAccessibility`),
vì nó luôn đi kèm nhãn chữ hoặc nằm trong nút đã có nhãn. Icon **mang thông tin** —
ví dụ dấu cảnh báo "sắp hết hàng" đứng một mình cạnh con số tồn kho — thì phải truyền
`title` (web) hoặc `label` (mobile) để nó tự mô tả.

---

## 7. Việc còn treo

**Chưa xem được app mobile bằng mắt.** Dự án không cài `react-native-web` nên không
chạy được `expo start --web` trong môi trường chỉ có dòng lệnh. Phần mobile mới chỉ
được kiểm bằng: phân tích cú pháp qua babel của chính dự án, đối chiếu tên style và
tên component đã import, và giữ nguyên từng con số `fontSize` / `margin` cũ khi đổi
`<Text>` emoji thành `<Svg>`. Cần mở app trên máy thật một lượt để xác nhận.
