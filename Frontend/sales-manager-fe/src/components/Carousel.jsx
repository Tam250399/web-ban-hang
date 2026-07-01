import { useEffect, useRef, useState } from 'react'

function Carousel({ slides, autoPlayMs = 5000 }) {
  const [index, setIndex] = useState(0)
  const timerRef = useRef(null)

  const go = (i) => setIndex((i + slides.length) % slides.length)
  const next = () => go(index + 1)
  const prev = () => go(index - 1)

  useEffect(() => {
    if (slides.length <= 1 || !autoPlayMs) return
    timerRef.current = setInterval(() => setIndex(i => (i + 1) % slides.length), autoPlayMs)
    return () => clearInterval(timerRef.current)
  }, [slides.length, autoPlayMs, index])

  if (!slides.length) return null

  return (
    <div className="carousel">
      <div className="carousel-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {slides.map((slide, i) => (
          <div className="carousel-slide" key={slide.id ?? i}>
            <img src={slide.imageUrl} alt={slide.title || `slide-${i}`} />
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
          <button className="carousel-arrow carousel-arrow-prev" onClick={prev} aria-label="Trước">‹</button>
          <button className="carousel-arrow carousel-arrow-next" onClick={next} aria-label="Sau">›</button>
          <div className="carousel-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`carousel-dot ${i === index ? 'active' : ''}`}
                onClick={() => go(i)}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

export default Carousel
