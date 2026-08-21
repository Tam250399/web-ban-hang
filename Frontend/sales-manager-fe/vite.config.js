import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // autoUpdate: service worker mới tự thay thế bản cũ ở lần tải trang kế
      // tiếp. Chọn cách này thay vì hỏi người dùng "có bản mới, cập nhật
      // không?" — cửa hàng không cần thêm một hộp thoại nữa.
      registerType: 'autoUpdate',
      injectRegister: 'auto',

      manifest: {
        name: 'Cửa Hàng VLXD Lý Sáu',
        short_name: 'VLXD Lý Sáu',
        description: 'Xi măng, sắt thép, gạch, cát đá chính hãng — giao tận công trình.',
        lang: 'vi',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f3f5f8',
        theme_color: '#1F1D1A',
        icons: [
          { src: '/pwa-icon.png', sizes: '1024x1024', type: 'image/png', purpose: 'any' },
          // Bản maskable dùng lại icon nền trước của app Android: đã chừa sẵn
          // vùng an toàn nên khi hệ điều hành cắt tròn/vuông không bị mất logo.
          { src: '/pwa-icon-maskable.png', sizes: '1024x1024', type: 'image/png', purpose: 'maskable' },
        ],
      },

      workbox: {
        // Mọi đường dẫn không khớp file tĩnh nào đều trả index.html — nhờ vậy
        // mở /san-pham/12 lúc ngoại tuyến vẫn vào được app.
        navigateFallback: '/index.html',
        // Đừng để service worker chặn hai đường này: API cần dữ liệu thật, còn
        // /chathub là WebSocket.
        navigateFallbackDenylist: [/^\/api\//, /^\/chathub/],

        runtimeCaching: [
          {
            // Ảnh sản phẩm/banner trên MinIO đặt tên theo UUID nên không bao
            // giờ đổi nội dung -> cache-first là an toàn tuyệt đối.
            urlPattern: ({ request, url }) =>
              request.destination === 'image' && !url.pathname.startsWith('/api/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'anh-san-pham',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],

        // CỐ Ý không cache /api ở tầng service worker: dữ liệu đó gắn với phiên
        // đăng nhập, cache nhầm là người này thấy đơn hàng của người kia. Phần
        // đọc offline đã có src/hooks/useCachedResource.js lo, kèm dải báo rõ
        // "đang xem bản lưu lúc nào".
      },

      devOptions: {
        // Không bật service worker khi chạy `npm run dev`: nó sẽ cache mất bản
        // build cũ và làm hot-reload hoạt động rất khó đoán.
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/chathub': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})
