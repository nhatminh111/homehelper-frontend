import React, { useEffect, useRef } from 'react';
import '../../css/ConfirmModal.css';

const ConfirmModal = ({
  show,
  title = 'Xác nhận',
  message = 'Bạn có chắc chắn muốn thực hiện hành động này?',
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  loading = false,
}) => {
  const modalRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (show && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [show]);

  useEffect(() => {
    const handleKey = (e) => {
      if (!show) return;
      if (e.key === 'Escape' && !loading) onCancel?.();
      if (e.key === 'Enter' && !loading) onConfirm?.();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [show, loading, onCancel, onConfirm]);

  if (!show) return null;

  return (
    <div className="cm-overlay" role="dialog" aria-modal="true">
      <div className="cm-modal" ref={modalRef}>
        <div className="cm-header">
          <h5 className="cm-title">{title}</h5>
          <button className="cm-close" onClick={onCancel} disabled={loading} aria-label="Đóng">×</button>
        </div>
        <div className="cm-body">
          <p>{message}</p>
        </div>
        <div className="cm-footer">
          <button className="btn btn-light" onClick={onCancel} disabled={loading}>{cancelText}</button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading} ref={confirmBtnRef}>
            {loading ? 'Đang xử lý...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
