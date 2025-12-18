import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './AudioCallUI.css';

/**
 * 📞 AudioCallUI Component
 * Xử lý giao diện cuộc gọi âm thanh (outgoing, incoming, connected)
 */
const AudioCallUI = ({ 
  socket, 
  conversationId, 
  conversationName,
  recipientInfo,
  isOpen = false,
  onClose
}) => {
  const { user, token } = useAuth();
  const [callState, setCallState] = useState(null); // 'calling', 'connected', 'ended', 'rejected', 'missed'
  const [callId, setCallId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isInitiator, setIsInitiator] = useState(false);
  const [peerConnection, setPeerConnection] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [error, setError] = useState(null);
  const [connectionQuality, setConnectionQuality] = useState('medium');

  const durationIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const localAudioRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnectionRef = useRef(null);

  // ==================== CLEANUP ====================
  
  const cleanup = () => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    // Stop local stream
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }

    // Close peer connection
    if (peerConnection) {
      peerConnection.close();
      setPeerConnection(null);
    }

    setCallState(null);
    setCallId(null);
    setCallDuration(0);
    setIsInitiator(false);
  };

  useEffect(() => {
    return cleanup;
  }, []);

  // ==================== INITIATE CALL ====================

  const initiateCall = async () => {
    try {
      setError(null);
      setCallState('calling');

      // 1. API call to start
      const response = await fetch('/api/audio-calls/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ conversationId })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }

      const { data } = await response.json();
      setCallId(data.call.call_id);
      setIsInitiator(true);

      // 2. Get microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setLocalStream(stream);

        // Play local audio
        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
        }

        // 3. Setup WebRTC
        await setupPeerConnection(stream, true);

        // 4. Listen for callee response
        if (socket) {
          socket.on('call_accepted', handleCallAccepted);
          socket.on('call_rejected', handleCallRejected);
          socket.on('webrtc_answer', handleWebRTCAnswer);
          socket.on('ice_candidate', handleICECandidate);
        }
      } catch (micError) {
        setError('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
        setCallState(null);
        console.error('Microphone error:', micError);
      }
    } catch (err) {
      setError(err.message || 'Lỗi bắt đầu cuộc gọi');
      setCallState(null);
      console.error('Initiate call error:', err);
    }
  };

  // ==================== SETUP WEBRTC ====================

  const setupPeerConnection = async (stream, isInitiator = false) => {
    try {
      const config = {
        iceServers: [
          { urls: ['stun:stun.l.google.com:19302'] },
          { urls: ['stun:stun1.l.google.com:19302'] },
          { urls: ['stun:stun2.l.google.com:19302'] }
        ]
      };

      const pc = new RTCPeerConnection(config);
      peerConnectionRef.current = pc;

      // Add local stream
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.addEventListener('icecandidate', (event) => {
        if (event.candidate && socket) {
          socket.emit('ice_candidate', {
            callId,
            candidate: event.candidate
          });
        }
      });

      // Handle remote stream
      pc.addEventListener('track', (event) => {
        console.log('📞 Remote track received:', event.track.kind);
        setRemoteStream(event.streams[0]);
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      });

      // Handle connection state
      pc.addEventListener('connectionstatechange', () => {
        console.log('Connection state:', pc.connectionState);
        
        if (pc.connectionState === 'connected') {
          startTimeRef.current = Date.now();
          setCallState('connected');
          startDurationTimer();
          updateConnectionQuality(pc);
        } else if (
          pc.connectionState === 'disconnected' ||
          pc.connectionState === 'failed' ||
          pc.connectionState === 'closed'
        ) {
          if (callState === 'connected') {
            endCall(true);
          }
        }
      });

      setPeerConnection(pc);

      // If initiator, create offer
      if (isInitiator) {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        });
        await pc.setLocalDescription(offer);

        if (socket) {
          socket.emit('webrtc_offer', {
            callId,
            offer
          });
        }
      }

    } catch (err) {
      setError('Lỗi thiết lập WebRTC: ' + err.message);
      console.error('WebRTC setup error:', err);
    }
  };

  // ==================== RECEIVE CALL ====================

  const setupIncomingCallListener = () => {
    if (!socket) return;

    socket.on('incoming_call', (data) => {
      console.log('📱 Incoming call:', data);
      setIncomingCall(data);
    });
  };

  useEffect(() => {
    if (socket) {
      setupIncomingCallListener();
    }
  }, [socket]);

  const acceptCall = async () => {
    try {
      if (!incomingCall) return;

      setError(null);
      setCallState('calling');
      setCallId(incomingCall.callId);
      setIsInitiator(false);

      // 1. API call to accept
      const response = await fetch(
        `/api/audio-calls/${incomingCall.callId}/accept`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to accept call');
      }

      // 2. Get microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });
        setLocalStream(stream);

        if (localAudioRef.current) {
          localAudioRef.current.srcObject = stream;
        }

        // 3. Setup WebRTC
        await setupPeerConnection(stream, false);

        // 4. Emit accepted event
        if (socket) {
          socket.emit('call_accepted', { callId: incomingCall.callId });

          // Listen for offer
          socket.on('webrtc_offer', handleWebRTCOffer);
        }

        setIncomingCall(null);
      } catch (micError) {
        setError('Không thể truy cập microphone');
        setCallState(null);
        console.error('Microphone error:', micError);
      }
    } catch (err) {
      setError(err.message || 'Lỗi chấp nhận cuộc gọi');
      setCallState(null);
      console.error('Accept call error:', err);
    }
  };

  const rejectCall = async (reason = 'Busy') => {
    try {
      if (!incomingCall) return;

      const response = await fetch(
        `/api/audio-calls/${incomingCall.callId}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ reason })
        }
      );

      if (response.ok && socket) {
        socket.emit('call_rejected', { 
          callId: incomingCall.callId, 
          reason 
        });
      }

      setIncomingCall(null);
    } catch (err) {
      console.error('Reject call error:', err);
    }
  };

  // ==================== WEBRTC HANDLERS ====================

  const handleWebRTCOffer = async (data) => {
    try {
      if (data.callId !== callId) return;

      if (!peerConnectionRef.current) return;

      const pc = peerConnectionRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      if (socket) {
        socket.emit('webrtc_answer', {
          callId,
          answer
        });
      }
    } catch (err) {
      setError('Lỗi xử lý offer: ' + err.message);
      console.error('Handle offer error:', err);
    }
  };

  const handleWebRTCAnswer = async (data) => {
    try {
      if (data.callId !== callId) return;

      if (!peerConnectionRef.current) return;

      const pc = peerConnectionRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (err) {
      setError('Lỗi xử lý answer: ' + err.message);
      console.error('Handle answer error:', err);
    }
  };

  const handleICECandidate = (data) => {
    if (data.callId !== callId) return;

    if (data.candidate && peerConnectionRef.current) {
      try {
        peerConnectionRef.current.addIceCandidate(
          new RTCIceCandidate(data.candidate)
        );
      } catch (err) {
        console.error('Error adding ICE candidate:', err);
      }
    }
  };

  const handleCallAccepted = () => {
    console.log('✅ Call accepted by callee');
    // Call state will update when WebRTC connects
  };

  const handleCallRejected = (data) => {
    setCallState('rejected');
    setError(`Cuộc gọi bị từ chối: ${data.reason || 'Unknown reason'}`);
    
    cleanup();
    setTimeout(() => {
      setCallState(null);
      setError(null);
    }, 3000);
  };

  // ==================== CALL MANAGEMENT ====================

  const startDurationTimer = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    durationIntervalRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  };

  const updateConnectionQuality = (pc) => {
    // Simplified quality detection
    // In production, would analyze bandwidth, latency, packet loss, etc.
    setConnectionQuality('high');
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const endCall = async (autoEnd = false) => {
    try {
      if (!callId) return;

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // API call to end
      const response = await fetch(`/api/audio-calls/${callId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          duration: callDuration,
          quality: connectionQuality
        })
      });

      if (response.ok && socket) {
        socket.emit('call_ended', { callId });
      }

      setCallState('ended');

      // Show ended state briefly
      setTimeout(() => {
        cleanup();
        onClose?.();
      }, 2000);

    } catch (err) {
      console.error('End call error:', err);
      cleanup();
      onClose?.();
    }
  };

  // ==================== RENDER ====================

  if (!isOpen && !incomingCall && !callState) {
    return null;
  }

  // Incoming call notification
  if (incomingCall && !callState) {
    return (
      <div className="audio-call-overlay">
        <div className="incoming-call-card">
          <div className="caller-info">
            <img 
              src={incomingCall.caller?.avatar || '/default-avatar.png'} 
              alt="caller" 
              className="caller-avatar"
            />
            <h2>{incomingCall.caller?.name || 'Unknown Caller'}</h2>
            <p>📞 Cuộc gọi đến</p>
          </div>

          <div className="incoming-call-actions">
            <button 
              className="btn-accept"
              onClick={acceptCall}
              title="Chấp nhận cuộc gọi (Ctrl+A)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>Chấp nhận</span>
            </button>
            <button 
              className="btn-reject"
              onClick={() => rejectCall()}
              title="Từ chối cuộc gọi (Ctrl+R)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1"></circle>
                <path d="M12 1v6m0 6v6"></path>
                <path d="M4.22 4.22l4.24 4.24m5.08 0l4.24-4.24"></path>
                <path d="M1 12h6m6 0h6"></path>
                <path d="M4.22 19.78l4.24-4.24m5.08 0l4.24 4.24"></path>
              </svg>
              <span>Từ chối</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Calling / Connected / Ended state
  return (
    <div className={`audio-call-container ${callState || 'calling'}`}>
      {/* Audio elements */}
      <audio 
        ref={localAudioRef} 
        autoPlay 
        muted 
        playsInline
      />
      <audio 
        ref={remoteAudioRef} 
        autoPlay 
        playsInline
      />

      {/* Main call UI */}
      <div className="call-header">
        <button 
          className="btn-minimize"
          onClick={onClose}
          title="Phóng to/Thu nhỏ"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
        <span className="conversation-name">{conversationName || 'Call'}</span>
        <div className="call-duration">{formatDuration(callDuration)}</div>
      </div>

      <div className="call-body">
        {/* Recipient info */}
        <div className="recipient-card">
          <img 
            src={recipientInfo?.avatar || '/default-avatar.png'} 
            alt="recipient" 
            className="recipient-avatar"
          />
          <h3>{recipientInfo?.name || 'Unknown User'}</h3>
          <p className={`call-status ${callState}`}>
            {callState === 'calling' && '⏳ Đang gọi...'}
            {callState === 'connected' && '🎤 Đang gọi'}
            {callState === 'ended' && '✓ Cuộc gọi kết thúc'}
            {callState === 'rejected' && '❌ Bị từ chối'}
            {callState === 'missed' && '📵 Bỏ lỡ'}
          </p>
          {callState === 'connected' && (
            <div className="connection-quality">
              <span className={`quality-indicator ${connectionQuality}`}></span>
              <span className="quality-text">
                {connectionQuality === 'high' && 'Tốt'}
                {connectionQuality === 'medium' && 'Bình thường'}
                {connectionQuality === 'low' && 'Yếu'}
              </span>
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
      </div>

      {/* Call controls */}
      <div className="call-controls">
        {callState === 'calling' || callState === 'connected' ? (
          <button 
            className="btn-end-call"
            onClick={() => endCall(false)}
            title="Kết thúc cuộc gọi (Escape)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M16.22 16.22a4 4 0 0 0-5.64-5.64"></path>
            </svg>
            <span>Kết thúc</span>
          </button>
        ) : null}
      </div>

      {/* Keyboard shortcuts hint */}
      {(callState === 'calling' || !callState) && (
        <div className="keyboard-hints">
          <small>Enter = Gọi | Escape = Đóng</small>
        </div>
      )}
    </div>
  );
};

export default AudioCallUI;
