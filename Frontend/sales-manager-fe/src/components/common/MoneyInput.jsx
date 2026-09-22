/**
 * Ô nhập liệu số tiền có tự động định dạng dấu phân cách
 */
function MoneyInput({ value, onChange, className = '', ...rest }) {
  const display = value === '' || value === null || value === undefined
    ? ''
    : Number(value).toLocaleString('vi-VN')

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    onChange({ target: { value: raw } })
  }

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        className="w-full rounded-lg border border-stone-300 bg-white py-1.5 pl-3 pr-8 text-xs sm:text-sm text-right font-medium text-stone-900 shadow-2xs placeholder:text-stone-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 transition"
        {...rest}
      />
      <span className="pointer-events-none absolute right-2.5 text-xs font-semibold text-stone-400">
        đ
      </span>
    </div>
  )
}

export default MoneyInput
