import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

/**
 * Component hiển thị hình ảnh tối ưu (OptimizedImage)
 * - Lazy Loading: Chỉ kích hoạt tải hình ảnh khi người dùng cuộn tới gần (IntersectionObserver + rootMargin)
 * - Tối ưu định dạng WebP: Tự động hỗ trợ WebP, giải mã async
 * - Skeleton Shimmer: Hiệu ứng vệt sáng placeholder mượt mà trong khi tải, triệt tiêu giật khung hình (0 CLS)
 * - Hiệu ứng chuyển cảnh: Mờ dần (fade-in) êm ái khi ảnh tải xong
 * - Fallback thanh lịch: Tự động hiển thị placeholder icon nếu link ảnh bị lỗi
 * - Tương thích Cache trình duyệt: Kiểm tra img.complete ngay lập tức để không bị đơ loading khi ảnh đã có trong cache
 */
export default function OptimizedImage({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  width,
  height,
  fallbackIcon = 'cube',
  onLoad,
  onError,
  priority = false, // Nếu priority = true (ví dụ Banner đầu trang), tải ngay không chờ scroll
  ...rest
}) {
  const containerRef = useRef(null)
  const imgRef = useRef(null)
  const [isInView, setIsInView] = useState(priority)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Kiểm tra nếu ảnh đã được cache sẵn trong trình duyệt
  const checkComplete = (img) => {
    if (img && img.complete) {
      if (img.naturalWidth > 0) {
        setIsLoaded(true)
      } else if (img.src) {
        setHasError(true)
      }
    }
  }

  const setImgRef = (node) => {
    imgRef.current = node
    checkComplete(node)
  }

  // Đảm bảo priority cập nhật isInView
  useEffect(() => {
    if (priority) {
      setIsInView(true)
    }
  }, [priority])

  // IntersectionObserver: Chỉ kích hoạt tải ảnh khi cách viewport 200px
  useEffect(() => {
    if (priority || isInView) return

    const el = containerRef.current
    if (!el) return

    if (!('IntersectionObserver' in window)) {
      setIsInView(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '200px 0px', // Bắt đầu tải trước khi cuộn tới 200px để người dùng không phải chờ
        threshold: 0.01,
      }
    )

    observer.observe(el)

    return () => observer.disconnect()
  }, [priority, isInView])

  // Reset trạng thái nếu src thay đổi và kiểm tra cache
  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
    checkComplete(imgRef.current)
  }, [src, isInView])

  const handleImageLoad = (e) => {
    setIsLoaded(true)
    onLoad?.(e)
  }

  const handleImageError = (e) => {
    setHasError(true)
    setIsLoaded(true)
    onError?.(e)
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden bg-stone-100 flex items-center justify-center ${wrapperClassName}`}
      style={{ width: width || '100%', height: height || '100%' }}
    >
      {/* Skeleton Shimmer Placeholder trong lúc đang tải ảnh */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-stone-200 animate-pulse flex items-center justify-center">
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
          <Icon name={fallbackIcon} size={28} className="text-stone-300" />
        </div>
      )}

      {/* Hiển thị Icon fallback nếu không có ảnh hoặc ảnh bị lỗi */}
      {(!src || hasError) && (
        <div className="flex flex-col items-center justify-center text-stone-400 p-2 text-center select-none">
          <Icon name={fallbackIcon} size={36} className="mb-1 opacity-60" />
          <span className="text-[11px] font-medium text-stone-400">Hình ảnh sản phẩm</span>
        </div>
      )}

      {/* Thẻ ảnh chính thức (chỉ gán src khi đã cuộn tới gần hoặc priority=true) */}
      {src && !hasError && (
        <img
          ref={setImgRef}
          src={isInView ? src : undefined}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleImageLoad}
          onError={handleImageError}
          className={`${className} transition-opacity duration-300 ease-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...rest}
        />
      )}
    </div>
  )
}
