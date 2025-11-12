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
      </p>
      <p className="toast-message">{message}</p>
    </div>
    <button className="toast-close-btn" onClick={closeToast} aria-label="Đóng">
      ×
    </button>
  </div>
);

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
};

export const CustomToastContainer = () => (
  <ToastContainer
    containerId="custom-toast"
    position="top-right"
    autoClose={4500}
    hideProgressBar={false}
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
    style={{ background: 'transparent' }} // TẮT NỀN
  />
);

export default CustomToastContainer;