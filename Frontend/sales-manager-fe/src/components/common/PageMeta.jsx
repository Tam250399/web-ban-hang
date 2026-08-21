import { useLocation } from 'react-router-dom'

const SITE_NAME = 'Cửa Hàng VLXD Lý Sáu'

/**
 * Đặt title + thẻ mô tả cho từng trang.
 *
 * React 19 tự nhấc <title>/<meta>/<link> render trong component lên <head>, nên
 * không cần thư viện như react-helmet. Trước đây cả web dùng chung đúng một
 * title tĩnh trong index.html — chia sẻ link nào lên Zalo/Facebook cũng ra cùng
 * một dòng, và Google chỉ thấy một trang duy nhất.
 *
 * @param {{ title?: string, description?: string, noIndex?: boolean }} props
 *   noIndex: dùng cho trang riêng tư (đơn hàng, quản trị) — không nên lên kết
 *   quả tìm kiếm.
 */
function PageMeta({ title, description, noIndex = false }) {
  const { pathname } = useLocation()
  const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
  const canonical = `${window.location.origin}${pathname}`

  return (
    <>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonical} />
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </>
  )
}

export default PageMeta
