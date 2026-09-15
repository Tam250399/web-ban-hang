import { useLocation } from 'react-router-dom'

const SITE_NAME = 'Cửa Hàng VLXD Lý Sáu'

/**
 * Component thiết lập tiêu đề trang và meta SEO
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
