/**
 * Tiện ích tối ưu hóa hình ảnh: chuyển đổi sang WebP và nén giảm dung lượng
 */

/**
 * Kiểm tra xem trình duyệt có hỗ trợ xuất canvas sang định dạng WebP hay không
 */
export function isWebpSupported() {
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 1
    canvas.height = 1
    return canvas.toDataURL('image/webp').startsWith('data:image/webp')
  } catch {
    return false
  }
}

/**
 * Tự động thu nhỏ kích thước (resize) và chuyển đổi file ảnh sang định dạng WebP
 * Giảm 50% - 80% dung lượng so với JPG/PNG gốc trước khi tải lên
 * 
 * @param {File} file - File ảnh đầu vào (JPG, PNG, WebP...)
 * @param {Object} options - Tùy chọn cấu hình
 * @param {number} options.maxWidth - Chiều rộng tối đa (mặc định 1600px)
 * @param {number} options.maxHeight - Chiều cao tối đa (mặc định 1600px)
 * @param {number} options.quality - Chất lượng nén WebP từ 0 đến 1 (mặc định 0.82)
 * @returns {Promise<File>} - File ảnh mới định dạng WebP
 */
export async function compressAndConvertToWebP(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.82 } = {}) {
  // Nếu không phải file ảnh hoặc là GIF động (để giữ animation), trả về nguyên bản
  if (!file || !file.type.startsWith('image/') || file.type === 'image/gif') {
    return file
  }

  // Nếu trình duyệt không hỗ trợ WebP canvas, trả về file gốc
  if (!isWebpSupported()) {
    return file
  }

  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let width = img.width
        let height = img.height

        // Tính toán tỷ lệ co giãn nếu kích thước vượt quá giới hạn
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(file)
          return
        }

        // Vẽ ảnh lên canvas với làm mịn
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file)
              return
            }

            // Tạo tên file mới với đuôi .webp
            const originalName = file.name.replace(/\.[^/.]+$/, '')
            const webpFile = new File([blob], `${originalName}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            })

            // Nếu file WebP nén thành công và nhỏ hơn hoặc xấp xỉ file gốc, ưu tiên dùng WebP
            resolve(webpFile)
          },
          'image/webp',
          quality
        )
      }

      img.onerror = () => resolve(file)
      img.src = e.target.result
    }

    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}
