/**
 * 📞 AudioCallModal Component
 * Modal để hiển thị cuộc gọi âm thanh (active call only - incoming handled by IncomingCallNotification)
 */

import React, { useState, useRef, useEffect } from 'react';
import './Chat.css';
import './AudioCallModal.css';

const AudioCallModal = ({
  isOpen,
  callState,
  callDuration,
  recipientInfo,
  conversationName,
  error,
  loading,
  onEnd,
  onClose
}) => {
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);

  // Handle mute/unmute
  const toggleMute = () => {
    if (localAudioRef.current && localAudioRef.current.srcObject) {
      const audioTracks = localAudioRef.current.srcObject.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  if (!isOpen || !callState) {
    return null;
  }

  // Call UI (outgoing/connected)
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusText = () => {
    switch (callState) {
      case 'calling':
        return '⏳ Đang gọi...';
      case 'connected':
        return '🎤 Đang gọi';
      case 'ended':
        return '✓ Cuộc gọi kết thúc';
      case 'rejected':
        return '❌ Bị từ chối';
      case 'missed':
        return '📵 Bỏ lỡ';
      case 'busy':
        return '📵 Người dùng đang bận';
      default:
        return 'Cuộc gọi';
    }
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="audio-call-modal-container">
      {/* Audio elements */}
      <audio ref={localAudioRef} autoPlay muted playsInline />
      <audio ref={remoteAudioRef} autoPlay playsInline />

      {/* Header */}
      <div className="call-modal-header">
        <span className="conversation-name">{conversationName}</span>
        <div className="call-duration">{formatDuration(callDuration)}</div>
        <button
          className="btn-minimize"
          onClick={onClose}
          title="Đóng"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      <div className="call-modal-body">
        <div className="recipient-card">
          <div className={`recipient-avatar-wrapper ${callState === 'calling' ? 'pulse' : ''}`}>
            {recipientInfo?.avatar ? (
              <img
                src={recipientInfo.avatar}
                alt="recipient"
                className="recipient-avatar"
              />
            ) : (
              <div className="recipient-avatar-initials">
                {getInitials(recipientInfo?.name || 'User')}
              </div>
            )}
            {callState === 'calling' && <div className="avatar-pulse-ring"></div>}
          </div>
          <h3>{recipientInfo?.name || 'User'}</h3>
          <p className={`call-status ${callState}`}>
            {getStatusText()}
          </p>
          {error && <div className="error-message">{error}</div>}

          {/* Waveform animation when connected */}
          {callState === 'connected' && (
            <div className="waveform">
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
              <span className="bar"></span>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="call-modal-controls">
        {(callState === 'calling' || callState === 'connected') && (
          <>
            {callState === 'connected' && (
              <button
                className={`btn-control ${isMuted ? 'active' : ''}`}
                onClick={toggleMute}
                title={isMuted ? 'Bật mic' : 'Tắt mic'}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {isMuted ? (
                    <>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                      <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </>
                  ) : (
                    <>
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                      <line x1="12" y1="19" x2="12" y2="23"></line>
                      <line x1="8" y1="23" x2="16" y2="23"></line>
                    </>
                  )}
                </svg>
                <span>{isMuted ? 'Bật mic' : 'Tắt mic'}</span>
              </button>
            )}
            <button
              className="btn-end-call"
              onClick={() => onEnd()}
              disabled={loading}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M23 1L1 23M1 1l22 22"></path>
              </svg>
              <span>Kết thúc</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default AudioCallModal;
