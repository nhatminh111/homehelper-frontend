import React from 'react';

/**
 * 📞 AudioCallMessage Component
 * Hiển thị audio call messages trong chat
 */
const AudioCallMessage = ({ message }) => {
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected':
      case 'ended':
        return '✓';
      case 'rejected':
        return '✗';
      case 'missed':
        return '📵';
      case 'calling':
      default:
        return '⏳';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'ended':
        return 'Cuộc gọi kết thúc';
      case 'rejected':
        return 'Bị từ chối';
      case 'missed':
        return 'Bỏ lỡ';
      case 'calling':
        return 'Đang gọi...';
      default:
        return 'Cuộc gọi';
    }
  };

  const status = message.call_status || 'ended';
  const duration = message.duration ? formatDuration(message.duration) : '';
  const quality = message.quality ? `(${quality})` : '';

  return (
    <div className="audio-call-message">
      <div className="call-content">
        <div className="call-icon">📞</div>
        <div className="call-info">
          <div className="call-status-line">
            {getStatusIcon(status)} {getStatusLabel(status)}
            {duration && <span className="call-duration">{duration}</span>}
          </div>
          {message.content && <div className="call-description">{message.content}</div>}
        </div>
      </div>
      {quality && <div className="call-quality">{quality}</div>}
    </div>
  );
};

export default AudioCallMessage;
