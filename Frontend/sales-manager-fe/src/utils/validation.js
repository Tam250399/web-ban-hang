// Kiểm tra dữ liệu nhập phía client.
//
// Lưu ý: backend chỉ kiểm tra Username/Password khác rỗng
// (Backend/SalesManagerBE/Services/AuthService.cs), nên những quy tắc dưới đây
// là hàng rào duy nhất.
//
// File này là bản sao của Mobile/sales-manager-mobile/src/utils/validation.js —
// hai nền tảng dùng chung một backend nên chính sách mật khẩu phải khớp nhau.
// Sửa một bên thì nhớ sửa bên kia. Chúng bảo vệ người dùng khỏi tự đặt mật khẩu quá yếu,
// chứ không thay được việc siết ở server — ai gọi thẳng API vẫn lách được.

export const PASSWORD_MIN_LENGTH = 8

// Mật khẩu hay gặp trong các đợt lộ dữ liệu, cộng vài biến thể kiểu Việt Nam.
// Danh sách ngắn và cố ý thế: bắt đúng những lựa chọn tệ nhất mà không biến ô
// mật khẩu thành câu đố.
const COMMON_PASSWORDS = new Set([
  '12345678', '123456789', '1234567890', 'password', 'password1', 'passw0rd',
  'qwertyui', 'qwerty123', 'abc12345', '11111111', '00000000', 'iloveyou',
  'matkhau1', 'vietnam1', 'admin123', 'adminadmin', '87654321', 'letmein1',
])

/**
 * @returns {string} chuỗi rỗng nếu hợp lệ, ngược lại là thông báo lỗi tiếng Việt.
 */
export function validatePassword(password) {
  if (!password) return 'Vui lòng nhập mật khẩu'
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Mật khẩu cần ít nhất ${PASSWORD_MIN_LENGTH} ký tự`
  }
  if (!/[a-zA-Z]/.test(password)) return 'Mật khẩu cần có ít nhất một chữ cái'
  if (!/[0-9]/.test(password)) return 'Mật khẩu cần có ít nhất một chữ số'
  if (/\s/.test(password)) return 'Mật khẩu không được chứa dấu cách'
  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return 'Mật khẩu này quá phổ biến, hãy chọn mật khẩu khác'
  }
  return ''
}

/**
 * Đánh giá độ mạnh để hiện thanh gợi ý — chỉ là phản hồi trực quan, việc chặn
 * hay không vẫn do validatePassword quyết định.
 * @returns {{ level: 0|1|2|3, label: string, color: string }}
 */
export function getPasswordStrength(password) {
  if (!password) return { level: 0, label: '', color: '#CBD5E1' }

  let score = 0
  if (password.length >= PASSWORD_MIN_LENGTH) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return { level: 1, label: 'Quá phổ biến', color: '#DC2626' }
  }
  if (score <= 2) return { level: 1, label: 'Yếu', color: '#DC2626' }
  if (score <= 3) return { level: 2, label: 'Trung bình', color: '#D97706' }
  return { level: 3, label: 'Mạnh', color: '#16A34A' }
}

export function validateUsername(username) {
  const value = (username || '').trim()
  if (!value) return 'Vui lòng nhập tên đăng nhập'
  if (value.length < 3) return 'Tên đăng nhập cần ít nhất 3 ký tự'
  if (value.length > 32) return 'Tên đăng nhập tối đa 32 ký tự'
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
    return 'Chỉ dùng chữ không dấu, số và các ký tự . _ -'
  }
  return ''
}

export function validateFullName(fullName) {
  const value = (fullName || '').trim()
  if (!value) return 'Vui lòng nhập họ và tên'
  if (value.length < 2) return 'Họ và tên quá ngắn'
  return ''
}

/** Email là tuỳ chọn — chỉ kiểm định dạng khi người dùng có nhập. */
export function validateEmail(email) {
  const value = (email || '').trim()
  if (!value) return ''
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) return 'Email không đúng định dạng'
  return ''
}

/** Số điện thoại cũng là tuỳ chọn; chấp nhận cả dạng +84 lẫn 0xxx. */
export function validatePhoneNumber(phoneNumber) {
  const value = (phoneNumber || '').trim()
  if (!value) return ''
  const digits = value.replace(/[\s.-]/g, '')
  if (!/^(0\d{9}|\+84\d{9})$/.test(digits)) {
    return 'Số điện thoại không hợp lệ (vd: 0987654321)'
  }
  return ''
}
