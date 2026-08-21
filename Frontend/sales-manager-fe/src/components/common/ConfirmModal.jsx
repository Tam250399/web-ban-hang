import { useModalA11y } from '../../hooks/useModalA11y'

/**
 * Hộp thoại xác nhận dùng chung.
 *
 * Mặc định vẫn là ngữ cảnh "xóa" để 9 chỗ đang dùng sẵn không phải sửa gì, nhưng
 * cho phép đổi tiêu đề/nhãn nút để dùng được cho thao tác khác (vd. huỷ đơn hàng
 * — không phải xoá, và cũng không phải "không thể hoàn tác").
 */
function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  title = 'Xác nhận xóa',
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
  icon = '🗑️',
  warning = 'Hành động này không thể hoàn tác.',
}) {
  const dialogRef = useModalA11y({ onClose: onCancel })

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="confirm-modal"
        onClick={e => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="confirm-icon" aria-hidden="true">{icon}</div>
        <h3 className="confirm-title" id="confirm-modal-title">{title}</h3>
        <p className="confirm-message">{message || 'Bạn có chắc muốn xóa mục này không?'}</p>
        {warning && <p className="confirm-warning">{warning}</p>}
        <div className="confirm-actions">
          <button className="btn-ghost" onClick={onCancel}>{cancelLabel}</button>
          <button className="btn-danger" onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
