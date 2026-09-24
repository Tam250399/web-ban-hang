import { useEffect, useState } from 'react'
import { resolveMediaUrl } from '../services/config'
import OptimizedImage from './common/OptimizedImage'

/**
 * Hàm prefersReducedMotion: thực thi chức năng xử lý của module
 */
const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/**
 * Component trình chiếu banner quảng cáo tự động cuộn
 */
function Carousel({ slides, autoPlayMs = 5000 }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(() => prefersReducedMotion())

  const go = (i) => setIndex((i + slides.length) % slides.length)
  const next = () => go(index + 1)
  const prev = () => go(index - 1)

  useEffect(() => {
    if (paused || slides.length <= 1 || !autoPlayMs) return
    const timer = setInterval(() => setIndex(i => (i + 1) % slides.length), autoPlayMs)
    return () => clearInterval(timer)
  }, [slides.length, autoPlayMs, paused])

  if (!slides.length) return null

  const canAutoPlay = slides.length > 1 && !!autoPlayMs

  return (
    <div
      className="group relative overflow-hidden w-full rounded-2xl sm:rounded-3xl shadow-sm select-none"
      onMouseEnter={() => canAutoPlay && setPaused(true)}
      onMouseLeave={() => canAutoPlay && setPaused(prefersReducedMotion())}
      aria-roledescription="carousel"
      aria-label="Banner khuyến mãi"
    >
      {/* Slides Track */}
      <div
        className="flex transition-transform duration-500 ease-out w-full"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {slides.map((slide, i) => (
          <div className="w-full shrink-0 relative aspect-[16/7] sm:aspect-[21/8] md:aspect-[24/8] bg-stone-100" key={slide.id ?? i}>
            <OptimizedImage
              src={resolveMediaUrl(slide.imageUrl)}
              alt={slide.title || `slide-${i}`}
              className="w-full h-full object-cover"
              wrapperClassName="w-full h-full"
              priority={i === 0}
              fallbackIcon="megaphone"
            />
            {(slide.title || slide.description) && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 sm:p-6 md:p-8 text-white">
                {slide.title && <h3 className="text-base sm:text-xl md:text-2xl font-bold drop-shadow-xs">{slide.title}</h3>}
                {slide.description && <p className="text-xs sm:text-sm text-stone-200 mt-1 max-w-xl line-clamp-2 drop-shadow-xs">{slide.description}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Navigation Controls */}
      {slides.length > 1 && (
        <>
          <button
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white text-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xs"
            onClick={prev}
            aria-label="Banner trước"
          >
            ‹
          </button>
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/40 hover:bg-black/70 text-white text-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xs"
            onClick={next}
            aria-label="Banner sau"
          >
            ›
          </button>
          <button
            type="button"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/70 text-white text-xs flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xs"
            onClick={() => setPaused(p => !p)}
            aria-label={paused ? 'Tiếp tục chạy banner' : 'Tạm dừng banner'}
          >
            {paused ? '▶' : '❚❚'}
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === index ? 'w-6 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'
                }`}
                onClick={() => go(i)}
                aria-label={`Banner ${i + 1} trên ${slides.length}`}
                aria-current={i === index}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Carousel
