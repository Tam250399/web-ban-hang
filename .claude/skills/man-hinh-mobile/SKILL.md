---
name: man-hinh-mobile
description: Quy ước dựng và sửa màn hình app Expo/React Native ở Mobile/sales-manager-mobile — thêm screen, gắn vào navigator, nạp dữ liệu có cache offline, dùng theme/font/haptics và bộ component ui có sẵn. Dùng skill này mỗi khi công việc đụng tới file trong Mobile/sales-manager-mobile/src, kể cả khi người dùng chỉ nói "thêm màn X cho app", "sửa app mobile", "app hiển thị thêm Z", "làm bên điện thoại giống bên web". App đã qua nhiều đợt chuẩn hoá — tự viết lại hook hay style màu là phá vỡ tính nhất quán đó.
---

# Màn hình mobile

App này không phải bản sao của web. Nó có bộ component riêng, theme riêng, và cách nạp dữ liệu khác web ở một điểm quan trọng: **AsyncStorage đọc bất đồng bộ**, nên luôn có một nhịp loading trước khi cache hiện ra — trong khi bên web `localStorage` đọc đồng bộ nên có dữ liệu ngay lượt render đầu. Đừng bê nguyên giả định của web sang.

## Đã có sẵn — dùng lại, đừng viết lại

**Hook** (`src/hooks/`)
- `useCachedResource(cacheKey, fetcher)` — cache-then-network, khoá lấy từ `CACHE_KEYS` trong `src/services/cache.js`.
- `useDebouncedValue`, `useRequireOnline`.

**Component UI** (`src/components/ui/`)
`Icon`, `Buttons`, `FormField`, `MoneyField`, `PickerField`, `DropdownSelect`, `BigPickerModal`, `SearchableSelectModal`, `Skeleton`, `OfflineBanner`, `ErrorBoundary`, `AppLockGate`, `BrandTag`, `LogoBadge`, `HazardStripe`, `icons`, `toastConfig`.

**Biểu tượng: `<Icon name="cart" size={16} color={brand.text} />`, không dùng emoji.** Các đường vẽ trong `Icon.js` giống hệt bản web (`Frontend/sales-manager-fe/src/components/common/Icon.jsx`) — sửa một icon là phải sửa cả hai file. `icons.js` là bộ riêng của thanh tab dưới, vẽ đầy đặn hơn, giữ nguyên. Icon đứng cạnh chữ thì bọc trong `<View style={ICON_ROW}>` (hằng xuất từ `Icon.js`).

**Vùng chạm phải có tên.** React Native tự lấy `<Text>` con làm tên cho máy đọc màn hình, nên nút có nhãn chữ thì không cần khai gì thêm. Nút chỉ có icon — hoặc chỉ có ký hiệu như `✕`, `＋`, `−` — thì bắt buộc `accessibilityLabel`, nếu không TalkBack chỉ đọc "nút".

**Theme** (`src/theme/`) — `colors.js` export hai bảng: `brand` (giao diện khách) và `admin` (khu quản trị). `fonts.js` export `fonts` và hook `useAppFonts()`. Không hardcode mã màu hay tên font trong screen; màu lạ lọt vào là lộ ngay vì app dùng bảng màu rất đặc trưng.

**Tiện ích** (`src/utils/format.js`) — `formatVnd`, `formatDay`, `formatTime`, `formatDDMMYYYY`, `formatYYYYMMDD`, `isSameDay`, `startOfDay`, `WEEKDAYS`. Định dạng tiền và ngày luôn dùng ở đây, đừng `toLocaleString` rải rác.

**Phản hồi xúc giác** (`src/services/haptics.js`) — `tapFeedback`, `successFeedback`, `errorFeedback`, `warningFeedback`. Gắn vào thao tác quan trọng (lưu, xoá, lỗi); đây là thứ làm app native khác web.

## Thêm một screen

1. Tạo file trong `src/screens/` (màn quản trị thì `src/screens/admin/`).
2. Đăng ký trong `src/navigation/RootNavigator.js`:
   - Màn thường: `<Stack.Screen name="X" component={X} />`.
   - Màn form: dùng `options={{ presentation: 'fullScreenModal', gestureEnabled: false }}` như `StockForm` — tắt vuốt xuống để người dùng không mất dữ liệu đang nhập.
   - Màn thuộc luồng auth: đặt trong `Stack.Group` có `gestureEnabled: false`.
3. Nếu là tab dưới cùng thì sửa `src/navigation/CustomerTabs.js`. Lưu ý tab ở đây **đổi component theo vai trò**: cùng một ô tab, Admin thấy màn khác Customer (`isAdmin ? StockExportTabScreen : CustomerChatScreen`). Thêm tab mới phải trả lời được cả hai vai trò thấy gì.
4. Bọc `SafeAreaView` / dùng `useSafeAreaInsets` — đừng để nội dung chui lên tai thỏ hoặc dưới thanh gesture.

## Bẫy: ô nhập trong danh sách ảo hoá

`ListHeaderComponent`, `ListFooterComponent`, `ListEmptyComponent` của FlatList phải nhận
**phần tử**, không phải hàm:

```jsx
ListHeaderComponent={renderHeader()}   // đúng
ListHeaderComponent={renderHeader}     // sai
```

VirtualizedList xử lý prop này bằng `React.isValidElement(C) ? C : React.createElement(C)`.
Truyền hàm thì C thành KIỂU component; hàm tạo mới mỗi lần render nên React coi là kiểu
khác, gỡ cả cây header rồi dựng lại. Có `<TextInput>` trong đó thì nó mất focus và bàn
phím đóng ngay sau ký tự đầu tiên. `useCallback` không cứu được vì hàm đọc chính state
đang gõ. `StockExportPanel.js` làm đúng: `const listHeader = (<View>...)`.

Danh sách nào có ô tìm kiếm cũng nên đặt `keyboardShouldPersistTaps="handled"` — mặc định
là `'never'`, nghĩa là cú chạm đầu tiên sau khi gõ chỉ dùng để đóng bàn phím rồi bị nuốt,
người dùng phải chạm hai lần.

## Gọi API

Service nằm ở `src/services/<ten>Service.js`, dùng `request` với **đường dẫn tương đối**:

```js
import { request } from './apiClient'
const URL = '/product'
export const productService = { getAll: () => request(URL) }
```

`config.js` tự dò địa chỉ backend: IP LAN của máy chạy Metro khi chạy Expo Go, `10.0.2.2` khi chạy emulator Android. Không hardcode `localhost` — trên điện thoại đó là chính cái điện thoại.

Lỗi trả về là `ApiError` có `kind` (`network` | `timeout` | `auth` | `server`); dùng `isNetworkError(err)` rồi hiện qua `react-native-toast-message` với `toastConfig` sẵn có.

## Ảnh MinIO

Dùng `resolveMediaUrl()` trong `src/services/config.js`, cùng lý do như web: URL backend sinh ra trỏ `localhost`, vô nghĩa với điện thoại. Hiển thị ảnh bằng `expo-image`, không phải `Image` của react-native — đã chọn vậy để có cache và placeholder.

## Kiểm chứng

```bash
npm --prefix Mobile/sales-manager-mobile start
```

Không có công cụ tự động kiểm tra giao diện app ở đây, nên nói rõ với người dùng cần mở màn nào để xem. Kiểm tra tối thiểu: có mạng, tắt mạng (`OfflineBanner` phải hiện và dữ liệu cache vẫn còn), và với đúng vai trò (Admin/Customer thấy khác nhau).
