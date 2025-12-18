// src/components/common/CustomToast.js
import React from 'react';
import { ToastContainer, toast, Slide } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { CheckCircle, XCircle, Info, ExclamationTriangle } from 'react-bootstrap-icons';
import './CustomToast.css';

const iconMap = {
  success: <CheckCircle className="toast-icon" />,
  error: <XCircle className="toast-icon" />,
  info: <Info className="toast-icon" />,
  warning: <ExclamationTriangle className="toast-icon" />,
  confirm: <ExclamationTriangle className="toast-icon" />,
};

const ToastMessage = ({ type, message, closeToast }) => (
  <div className={`custom-toast ${type}`}>
    <div className="toast-icon-wrapper">
      {iconMap[type]}
    </div>
    <div className="toast-content">
      <p className="toast-title">
        {type === 'success' && 'Thành công'}
        {type === 'error' && 'Lỗi'}
        {type === 'info' && 'Thông tin'}
        {type === 'warning' && 'Cảnh báo'}
        {type === 'confirm' && 'Xác nhận'}
      </p>
      <p className="toast-message">{message}</p>
    </div>
    <button className="toast-close-btn" onClick={closeToast} aria-label="Đóng">
      ×
    </button>
  </div>
);

// Track active confirm to avoid stacking backdrops
let activeConfirmId = null;
let activeConfirmBackdrop = null;

export const showToast = {
  success: (msg) =>
    toast(<ToastMessage type="success" message={msg} />, {
      className: 'toast-success',
      progressClassName: 'toast-progress-success',
      containerId: 'custom-toast',
    }),
  error: (msg) =>
    toast(<ToastMessage type="error" message={msg} />, {
      className: 'toast-error',
      progressClassName: 'toast-progress-error',
      containerId: 'custom-toast',
    }),
  info: (msg) =>
    toast(<ToastMessage type="info" message={msg} />, {
      className: 'toast-info',
      progressClassName: 'toast-progress-info',
      containerId: 'custom-toast',
    }),
  warning: (msg) =>
    toast(<ToastMessage type="warning" message={msg} />, {
      className: 'toast-warning',
      progressClassName: 'toast-progress-warning',
      containerId: 'custom-toast',
    }),
  // Promise-based confirm toast
  confirm: (content, { backdrop = true, autoClose = 8000 } = {}) => {
    // Clean previous
    if (activeConfirmId) toast.dismiss(activeConfirmId);
    if (activeConfirmBackdrop && activeConfirmBackdrop.parentNode) {
      activeConfirmBackdrop.parentNode.removeChild(activeConfirmBackdrop);
      activeConfirmBackdrop = null;
    }
    return new Promise((resolve) => {
      let decided = false;
      const finish = (val, closeToast) => {
        if (decided) return;
        decided = true;
        try { closeToast && closeToast(); } catch { }
        if (activeConfirmId) toast.dismiss(activeConfirmId);
        if (activeConfirmBackdrop && activeConfirmBackdrop.parentNode) {
          activeConfirmBackdrop.parentNode.removeChild(activeConfirmBackdrop);
        }
        activeConfirmBackdrop = null;
        activeConfirmId = null;
        resolve(val);
      };
      const ConfirmBody = ({ closeToast }) => (
        <div className="custom-toast confirm" role="alertdialog" style={{ position: 'relative', zIndex: 20001 }}>
          <div className="toast-content" style={{ flex: 1 }}>
            {typeof content === 'string' ? <p className="mb-2">{content}</p> : content}
            <div className="d-flex gap-2 justify-content-end mt-2">
              <button className="btn btn-sm btn-success" autoFocus onClick={() => finish(true, closeToast)}>Đồng ý</button>
              <button className="btn btn-sm btn-secondary" onClick={() => finish(false, closeToast)}>Huỷ</button>
            </div>
          </div>
          <button className="toast-close-btn" aria-label="Đóng" onClick={() => finish(false, closeToast)}>×</button>
        </div>
      );
      // Create backdrop BEFORE toast to guarantee ordering
      if (backdrop) {
        const el = document.createElement('div');
        Object.assign(el.style, {
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 20000
        });
        el.onclick = () => finish(false);
        document.body.appendChild(el);
        activeConfirmBackdrop = el;
      }
      const id = toast(({ closeToast }) => <ConfirmBody closeToast={closeToast} />, {
        containerId: 'custom-toast',
        autoClose,
        closeOnClick: false,
        draggable: false,
        pauseOnHover: false,
        hideProgressBar: false,
        closeButton: false,
        className: 'toast-confirm',
        onClose: () => { if (!decided) finish(false); },
        style: { zIndex: 21001, pointerEvents: 'auto' }
      });
      activeConfirmId = id;
    });
  }
};

export const CustomToastContainer = () => (
  <ToastContainer
    containerId="custom-toast"
    position="top-right"
    autoClose={4500}
    hideProgressBar={true}
    newestOnTop
    closeOnClick={false}
    pauseOnFocusLoss
    draggable
    pauseOnHover
    transition={Slide}
    limit={4}
    toastClassName="custom-toast-wrapper"
    bodyClassName="custom-toast-body"
    progressClassName="custom-toast-progress"
    className="custom-toast-container"
    closeButton={false} // TẮT NÚT ĐÓNG MẶC ĐỊNH
    style={{ background: 'transparent', zIndex: 21000 }} // Đảm bảo toast nằm trên backdrop xác nhận
  />
);

export default CustomToastContainer;