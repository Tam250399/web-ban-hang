---
name: man-hinh-web
description: Quy ước dựng và sửa giao diện web React ở Frontend/sales-manager-fe — thêm trang mới, thêm tab quản trị, sửa component, gọi dữ liệu có cache, xử lý mất mạng. Dùng skill này mỗi khi công việc đụng tới file trong Frontend/sales-manager-fe/src, kể cả khi người dùng chỉ nói "thêm màn X", "sửa giao diện Y", "thêm mục vào trang quản trị", "trang chủ hiển thị thêm Z". Dự án đã có sẵn hook, context và component dùng chung — viết lại từ đầu là tạo ra bản sao lệch hành vi.
---

# Màn hình web

Trước khi viết component mới, kiểm tra xem thứ mình định viết đã tồn tại chưa. Phần lớn "việc mới" ở đây thực chất là ghép lại đồ đã có.

## Đã có sẵn — dùng lại, đừng viết lại

**Hook** (`src/hooks/`)
- `useCachedResource(cacheKey, fetcher)` — cache-then-network: hiện ngay bản lưu trong localStorage rồi gọi API nền. Trả về `{ data, loading, refreshing, isStale, cachedAt, error, refresh }`. Đây là cách chuẩn để nạp dữ liệu danh sách; `useState + useEffect + fetch` tự chế sẽ mất phần offline và gây nháy trắng.
- `useDebouncedValue(value, ms)` — cho ô tìm kiếm.
- `useModalA11y` — bẫy focus và đóng bằng Esc cho modal.
- `useRequireOnline` — chặn thao tác ghi khi đang mất mạng.

**Component dùng chung** (`src/components/common/`)
`Icon`, `ConfirmModal`, `Pagination`, `SearchableSelect`, `MultiSearchableSelect`, `MoneyInput`, `OverflowMenu`, `PageMeta`, `OfflineBanner`, `ErrorBoundary`, `RequireAuth`, `CartDrawer`, `ChatWidget`.

**Biểu tượng: `<Icon name="cart" />`, không dùng emoji.** Bộ đường vẽ trong `Icon.jsx` giống hệt bản mobile (`Mobile/sales-manager-mobile/src/components/ui/Icon.js`) — thêm icon mới phải thêm ở cả hai file. Emoji đổi hình theo hệ điều hành và luôn tự tô màu nên không đổi theo trạng thái nút. Ký hiệu văn bản đơn sắc (`✕`, `←`, `▶`, `➤`) thì vẫn dùng bình thường vì chúng ăn theo `currentColor`.

**Context** (`src/context/`) — mỗi cái tách làm hai file: `XContext.jsx` chứa provider, `x-context.js` chứa hook `useX()`. Import hook từ file thường (`auth-context`, `cart-context`, `network-context`), không import từ file provider — tách vậy để Fast Refresh không rụng state mỗi lần sửa.

**Cache key** khai báo tập trung trong `src/services/cache.js` (`CACHE_KEYS`). Thêm khoá mới ở đó, không rải chuỗi.

## Thêm một trang mới

1. Khai báo đường dẫn trong `src/routes/paths.js` (`PATHS`). Đây là nguồn sự thật duy nhất — rải chuỗi `'/dang-nhap'` khắp nơi là cách nhanh nhất để sau này đổi URL rồi sót một chỗ.
2. Đăng ký route trong `AppRoutes` của `src/App.jsx`.
3. Trang cần đăng nhập thì bọc trong `<Route element={<RequireAuth adminOnly />}>` hoặc `customerOnly`.
4. Trang nặng (kéo theo thư viện lớn) thì `lazy()` + `<Suspense>` như `AdminDashboard` và `ChatWidget` đang làm — khách vãng lai chiếm phần lớn lượt truy cập và không nên phải tải thứ họ không dùng.

URL hiển thị cho người dùng viết bằng tiếng Việt không dấu (`/san-pham/:id`, `/don-hang-cua-toi`, `/quan-tri`).

## Thêm một tab quản trị

Ba chỗ, thiếu chỗ nào là tab hiện ra nhưng bấm vào trắng trang:

1. `src/routes/paths.js` → thêm mục vào `ADMIN_TABS` với `key` (định danh nội bộ), `slug` (phần hiện trên URL) và `label` kèm emoji. Nếu tab thuộc nhóm sidebar thì thêm `key` vào `tabKeys` của nhóm tương ứng trong `SIDEBAR_GROUPS`.
2. Viết panel trong `src/components/admin/<Ten>Manager.jsx`.
3. `src/components/AdminDashboard.jsx` → import panel và thêm dòng `{tab === '<key>' && <TenManager />}` trong `<main className="admin-main">`.

## Xử lý lỗi và trạng thái mạng

Lỗi từ `apiClient` là `ApiError` có trường `kind` (`network` | `timeout` | `auth` | `server`) và `message` tiếng Việt sẵn sàng hiện cho người dùng. Dùng `isNetworkError(err)` để phân biệt mất mạng với lỗi nghiệp vụ, rồi `toast.error(err.message)` (`react-hot-toast`). Đừng hiện mã HTTP thô.

Thao tác bị người dùng huỷ (component unmount, `AbortController`) được ném lại nguyên trạng — không toast những cái đó.

## Ảnh MinIO

Mọi URL ảnh từ backend phải đi qua `resolveMediaUrl()` trong `src/services/config.js` trước khi đưa vào `src`. Backend sinh URL theo `Minio:Endpoint` mặc định là `localhost:9000` — đúng trên máy dev, sai hoàn toàn khi người dùng mở web từ máy khác, vì `localhost` lúc đó là máy của họ.

## Văn phong giao diện

Toàn bộ chữ hiện cho người dùng bằng tiếng Việt có dấu. Comment trong code cũng viết tiếng Việt và giải thích **vì sao** chứ không mô tả lại code — đọc `apiClient.js` hoặc `useCachedResource.js` để thấy đúng giọng đang dùng.

## Kiểm chứng

Chạy web bằng cấu hình `frontend` trong `.claude/launch.json` (cổng 5173) rồi mở thật màn vừa sửa: kiểm tra cả trạng thái có mạng, mất mạng (`OfflineBanner` phải hiện), và ở khổ điện thoại. Kèm theo:

```bash
npm --prefix Frontend/sales-manager-fe run lint
```
