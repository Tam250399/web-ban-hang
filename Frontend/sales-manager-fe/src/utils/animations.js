import gsap from 'gsap'

/**
 * Hiệu ứng nảy icon giỏ hàng khi có sản phẩm được thêm vào
 */
export function bounceCartIcon() {
  const isMobile = window.innerWidth < 640
  const targetSelector = isMobile ? '#cart-btn-mobile' : '#cart-btn-desktop'
  const badgeSelector = isMobile ? '#cart-badge-mobile-target' : '#cart-badge-target'

  const cartBtn = document.querySelector(targetSelector)
  const cartBadge = document.querySelector(badgeSelector)

  if (cartBtn) {
    gsap.timeline()
      .to(cartBtn, { scale: 1.25, rotation: -8, duration: 0.12, ease: 'power2.out' })
      .to(cartBtn, { scale: 0.9, rotation: 8, duration: 0.12, ease: 'power2.in' })
      .to(cartBtn, { scale: 1.08, rotation: -4, duration: 0.1, ease: 'power2.out' })
      .to(cartBtn, { scale: 1, rotation: 0, duration: 0.2, ease: 'back.out(2)' })
  }

  if (cartBadge) {
    gsap.timeline()
      .to(cartBadge, { scale: 1.6, duration: 0.15, ease: 'back.out(2)' })
      .to(cartBadge, { scale: 1, duration: 0.25, ease: 'power2.out' })
  }
}

/**
 * Hiệu ứng ảnh/icon sản phẩm bay theo đường cong parabol vào giỏ hàng
 * @param {HTMLElement|MouseEvent} source - Element hoặc MouseEvent nơi xuất phát
 * @param {string} [imageUrl] - URL ảnh sản phẩm (nếu có)
 */
export function flyToCart(source, imageUrl = null) {
  let sourceRect = null

  if (source instanceof HTMLElement) {
    sourceRect = source.getBoundingClientRect()
  } else if (source?.target instanceof HTMLElement) {
    sourceRect = source.target.getBoundingClientRect()
  } else if (source?.clientX && source?.clientY) {
    sourceRect = {
      left: source.clientX - 20,
      top: source.clientY - 20,
      width: 40,
      height: 40,
    }
  }

  if (!sourceRect) {
    bounceCartIcon()
    return
  }

  const isMobile = window.innerWidth < 640
  const targetSelector = isMobile ? '#cart-btn-mobile' : '#cart-btn-desktop'
  const destEl = document.querySelector(targetSelector)

  if (!destEl) {
    bounceCartIcon()
    return
  }

  const destRect = destEl.getBoundingClientRect()

  // Tạo phần tử bay giả lập
  const flyer = document.createElement('div')
  flyer.className = 'fixed z-[9999] pointer-events-none rounded-2xl overflow-hidden shadow-2xl border-2 border-primary'
  flyer.style.width = '56px'
  flyer.style.height = '56px'
  flyer.style.left = '0px'
  flyer.style.top = '0px'
  flyer.style.willChange = 'transform, opacity'

  if (imageUrl) {
    flyer.innerHTML = `<img src="${imageUrl}" alt="flyer" class="w-full h-full object-cover rounded-2xl" />`
  } else {
    flyer.className += ' bg-primary text-white flex items-center justify-center font-bold text-xs'
    flyer.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>
        <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
      </svg>
    `
  }

  document.body.appendChild(flyer)

  const startX = sourceRect.left + sourceRect.width / 2 - 28
  const startY = sourceRect.top + sourceRect.height / 2 - 28
  const endX = destRect.left + destRect.width / 2 - 28
  const endY = destRect.top + destRect.height / 2 - 28

  // Vị trí đỉnh vòm parabol (bay bổng lên trên trước khi lao vào giỏ)
  const midY = Math.min(startY, endY) - Math.max(60, Math.abs(startX - endX) * 0.15)

  // Đặt vị trí ban đầu
  gsap.set(flyer, {
    x: startX,
    y: startY,
    scale: 1,
    opacity: 1,
    transformOrigin: 'center center',
  })

  // Animation timeline với GSAP
  const tl = gsap.timeline({
    onComplete: () => {
      if (flyer.parentNode) {
        flyer.parentNode.removeChild(flyer)
      }
      bounceCartIcon()
    },
  })

  // Hiệu ứng bay theo trục X và Y đồng thời với đường cong
  tl.to(flyer, {
    x: endX,
    duration: 0.65,
    ease: 'power1.inOut',
  }, 0)

  // Nhấc lên cao ở nửa đầu và lao xuống ở nửa sau
  tl.to(flyer, {
    y: midY,
    duration: 0.28,
    ease: 'power2.out',
  }, 0)
  .to(flyer, {
    y: endY,
    duration: 0.37,
    ease: 'power3.in',
  }, 0.28)

  // Thu nhỏ và xoay nhẹ khi chạm giỏ
  tl.to(flyer, {
    scale: 0.25,
    rotation: 360,
    opacity: 0.6,
    duration: 0.65,
    ease: 'power1.in',
  }, 0)
}
