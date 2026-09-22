import { useModalA11y } from '../../hooks/useModalA11y'
import { Icon } from './Icon'

/**
 * Hộp thoại xác nhận hành động nguy hiểm hoặc hủy đơn
 */
function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  title = 'Xác nhận xóa',
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
  icon = <Icon name="trash" size={28} />,
  warning = 'Hành động này không thể hoàn tác.',
}) {
  const dialogRef = useModalA11y({ onClose: onCancel })

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-7 text-center border border-brand-divider/60"
        onClick={e => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
      >
        <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 text-red-600 flex items-center justify-center" aria-hidden="true">
          {icon}
        </div>
        <h3 className="text-xl font-bold font-display text-ink mb-2" id="confirm-modal-title">
          {title}
        </h3>
        <p className="text-sm text-brand-text mb-3 leading-relaxed">
          {message || 'Bạn có chắc muốn xóa mục này không?'}
        </p>
        {warning && (
          <p className="text-xs text-red-600 font-medium mb-5 bg-red-50/80 p-2.5 rounded-xl border border-red-100">
            {warning}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            className="flex-1 px-4 py-2.5 rounded-xl border border-brand-divider text-ink font-bold text-sm hover:bg-neutral-100 transition cursor-pointer"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow transition cursor-pointer"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
