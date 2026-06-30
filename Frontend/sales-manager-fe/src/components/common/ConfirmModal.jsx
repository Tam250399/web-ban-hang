function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="confirm-modal" onClick={e => e.stopPropagation()}>
        <div className="confirm-icon">🗑️</div>
        <h3 className="confirm-title">Xác nhận xóa</h3>
        <p className="confirm-message">{message || 'Bạn có chắc muốn xóa mục này không?'}</p>
        <p className="confirm-warning">Hành động này không thể hoàn tác.</p>
        <div className="confirm-actions">
          <button className="btn-ghost" onClick={onCancel}>Hủy</button>
          <button className="btn-danger" onClick={onConfirm}>Xóa</button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmModal
