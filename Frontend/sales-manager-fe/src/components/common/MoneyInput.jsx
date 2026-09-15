function MoneyInput({ value, onChange, className = '', ...rest }) {
  const display = value === '' || value === null || value === undefined
    ? ''
    : Number(value).toLocaleString('vi-VN')

  const handleChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '')
    onChange({ target: { value: raw } })
  }

  return (
    <div className={`money-input ${className}`}>
      <input type="text" inputMode="numeric" value={display} onChange={handleChange} {...rest} />
      <span className="money-input-suffix">đ</span>
    </div>
  )
}

export default MoneyInput
