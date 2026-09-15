import { useEffect, useState } from 'react'
import { resolveMediaUrl } from '../services/config'

const prefersReducedMotion = () =>
  typeof window !== 'undefined'
  && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

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
      className="carousel"
      onMouseEnter={() => canAutoPlay && setPaused(true)}
      onMouseLeave={() => canAutoPlay && setPaused(prefersReducedMotion())}
      aria-roledescription="carousel"
      aria-label="Banner khuyến mãi">
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((slide, i) => (
          <div className="carousel-slide" key={slide.id ?? i}>
            <img
              src={resolveMediaUrl(slide.imageUrl)}
              alt={slide.title || `slide-${i}`}
              decoding="async"
              loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'auto'}
            />
            {(slide.title || slide.description) && (
              <div className="carousel-caption">
                {slide.title && <h3>{slide.title}</h3>}
                {slide.description && <p>{slide.description}</p>}
              </div>
            )}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <>
          <button className="carousel-arrow carousel-arrow-prev" onClick={prev} aria-label="Banner trước">‹</button>
          <button className="carousel-arrow carousel-arrow-next" onClick={next} aria-label="Banner sau">›</button>
          <button
            type="button"
            className="carousel-pause"
            onClick={() => setPaused(p => !p)}
            aria-label={paused ? 'Tiếp tục chạy banner' : 'Tạm dừng banner'}
          >
            {paused ? '▶' : '❚❚'}
          </button>
          <div className="carousel-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === index ? 'active' : ''}`}
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
