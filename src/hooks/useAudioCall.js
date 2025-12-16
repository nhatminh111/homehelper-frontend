/**
 * 📞 useAudioCall Hook
 * Quản lý trạng thái và logic cuộc gọi âm thanh
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSocket } from '../contexts/SocketContext';
import AudioCallService from '../services/audioCallService';

const useAudioCall = (conversationId) => {
  // State
  const [callState, setCallState] = useState(null); // 'calling', 'connected', 'ended', 'rejected', 'missed'
  const [callId, setCallId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isInitiator, setIsInitiator] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState('medium');
  const [remoteUserInfo, setRemoteUserInfo] = useState(null);

  // Refs
  const durationIntervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const callIdRef = useRef(null);
  const { getSocket } = useSocket();

  // Cleanup function
  const cleanup = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Remove any window-level listeners registered for this call
    try {
      if (window._audioCallCleanup && typeof window._audioCallCleanup === 'function') {
        window._audioCallCleanup();
        delete window._audioCallCleanup;
      }
    } catch (err) {
      console.error('Error running window._audioCallCleanup:', err);
    }

    setCallState(null);
    setCallId(null);
    callIdRef.current = null;
    setCallDuration(0);
    setIsInitiator(false);
    setIncomingCall(null);
    setRemoteUserInfo(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Initiate call
  const initiateCall = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      setCallState('calling');

      const data = await AudioCallService.initiateCall(conversationId);
      console.log('🎯 Data received in hook:', data);
      console.log('🎯 data.call:', data.call);
      console.log('🎯 data.call?.call_id:', data.call?.call_id);

      setCallId(data.call.call_id);
      callIdRef.current = data.call.call_id;
      setCallId(data.call.call_id);
      callIdRef.current = data.call.call_id;
      setIsInitiator(true);

      // Set remote user info from response (callee)
      if (data.callee) {
        setRemoteUserInfo(data.callee);
      }

      // Get microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        localStreamRef.current = stream;

        // Setup WebRTC
        setupPeerConnection(stream, true);

        // Listen for responses via custom events
        const handleCallAcceptedEvent = (e) => handleCallAccepted(e.detail);
        const handleCallRejectedEvent = (e) => handleCallRejected(e.detail);
        const handleWebRTCAnswerEvent = (e) => handleWebRTCAnswer(e.detail);
        const handleICECandidateEvent = (e) => handleICECandidate(e.detail);
        const handleCallEndedEvent = (e) => handleRemoteCallEnded(e.detail);

        window.addEventListener('socket_call_accepted', handleCallAcceptedEvent);
        window.addEventListener('socket_call_rejected', handleCallRejectedEvent);
        window.addEventListener('socket_webrtc_answer', handleWebRTCAnswerEvent);
        window.addEventListener('socket_ice_candidate', handleICECandidateEvent);
        window.addEventListener('socket_call_ended', handleCallEndedEvent);

        // Cleanup listeners when call ends
        const cleanup = () => {
          window.removeEventListener('socket_call_accepted', handleCallAcceptedEvent);
          window.removeEventListener('socket_call_rejected', handleCallRejectedEvent);
          window.removeEventListener('socket_webrtc_answer', handleWebRTCAnswerEvent);
          window.removeEventListener('socket_ice_candidate', handleICECandidateEvent);
          window.removeEventListener('socket_call_ended', handleCallEndedEvent);
        };

        // Store cleanup function
        window._audioCallCleanup = cleanup;
      } catch (micError) {
        setError('Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.');
        setCallState(null);
        console.error('Microphone error:', micError);
      }

      setLoading(false);
    } catch (err) {
      // Xử lý lỗi USER_BUSY
      if (err.response?.data?.code === 'USER_BUSY' || err.message?.includes('đang bận')) {
        setError('Người dùng đang bận. Vui lòng thử lại sau.');
        setCallState('busy');

        // Auto clear after 3 seconds
        setTimeout(() => {
          setCallState(null);
          setError(null);
        }, 3000);
      } else {
        setError(err.message || 'Lỗi bắt đầu cuộc gọi');
        setCallState(null);
      }

      setLoading(false);
      console.error('Initiate call error:', err);
    }
  }, [conversationId, getSocket]);

  // Setup peer connection
  const setupPeerConnection = async (stream, isInit = false) => {
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
        if (event.candidate) {
          const socket = getSocket();
          if (socket) {
            socket.emit('ice_candidate', {
              callId: callIdRef.current,
              candidate: event.candidate
            });
          }
        }
      });

      // Handle connection state
      pc.addEventListener('connectionstatechange', () => {
        console.log('Connection state:', pc.connectionState);

        if (pc.connectionState === 'connected') {
          startTimeRef.current = Date.now();
          setCallState('connected');
          startDurationTimer();
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

      // If initiator, create offer
      if (isInit) {
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false
        });
        await pc.setLocalDescription(offer);

        const socket = getSocket();
        if (socket) {
          socket.emit('webrtc_offer', {
            callId: callIdRef.current,
            offer
          });
        }
      }
    } catch (err) {
      setError('Lỗi thiết lập WebRTC: ' + err.message);
      console.error('WebRTC setup error:', err);
    }
  };

  // Accept call
  const acceptCall = useCallback(async (inCall) => {
    try {
      if (!inCall) return;

      setError(null);
      setLoading(true);
      setCallState('calling');
      setCallId(inCall.callId);
      callIdRef.current = inCall.callId;
      setIsInitiator(false);

      const data = await AudioCallService.acceptCall(inCall.callId);

      // Get microphone
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          }
        });

        localStreamRef.current = stream;

        await setupPeerConnection(stream, false);

        // Emit 'accept_call' to server to trigger broadcast
        const socket = getSocket();
        if (socket) {
          console.log('📤 [Callee] Emitting accept_call to server for call:', inCall.callId);
          socket.emit('accept_call', { callId: inCall.callId });
        }

        // Mark as connected and start timer immediately after acceptance (callee side)
        console.log('🟢 [Callee] Accepting call - setting connected state and starting timer');
        setCallState('connected');
        startTimeRef.current = Date.now();
        startDurationTimer();
        console.log('⏱️ [Callee] Timer started at:', new Date().toISOString());

        // Listen for webrtc_offer via custom event
        const handleWebRTCOfferEvent = (e) => {
          console.log('📨 [Callee] Received WebRTC offer');
          handleWebRTCOffer(e.detail);
        };
        window.addEventListener('socket_webrtc_offer', handleWebRTCOfferEvent);

        // Also listen for remote end events so UI can close when other side ends
        const handleCallEndedEvent = (e) => {
          console.log('📴 [Callee] Received remote call ended event');
          handleRemoteCallEnded(e.detail);
        };
        window.addEventListener('socket_call_ended', handleCallEndedEvent);

        // Also listen for callee-specific acceptance confirmation (call_accepted_self)
        const handleCallAcceptedSelfEvent = (e) => {
          console.log('✅ [Callee] Received call_accepted_self confirmation from server');
          // Ensure timer is running (should already be running, but this is a safety net)
          if (!durationIntervalRef.current) {
            console.log('⏱️ [Callee] Timer safety net: starting timer from call_accepted_self');
            startTimeRef.current = Date.now();
            startDurationTimer();
          }
        };
        window.addEventListener('socket_call_accepted_self', handleCallAcceptedSelfEvent);

        // Store cleanup for these listeners so they are removed when call ends
        window._audioCallCleanup = () => {
          window.removeEventListener('socket_webrtc_offer', handleWebRTCOfferEvent);
          window.removeEventListener('socket_call_ended', handleCallEndedEvent);
          window.removeEventListener('socket_call_accepted_self', handleCallAcceptedSelfEvent);
        };

        setIncomingCall(null);
        // Note: remoteUserInfo should have been set during incoming call handling
        setLoading(false);
      } catch (micError) {
        setError('Không thể truy cập microphone');
        setCallState(null);
        setLoading(false);
        console.error('Microphone error:', micError);
      }
    } catch (err) {
      setError(err.message || 'Lỗi chấp nhận cuộc gọi');
      setCallState(null);
      setLoading(false);
      console.error('Accept call error:', err);
    }
  }, [getSocket]);

  // Reject call
  const rejectCall = useCallback(async (inCall, reason = 'Busy') => {
    try {
      if (!inCall) return;

      await AudioCallService.rejectCall(inCall.callId, reason);

      const socket = getSocket();
      if (socket) {
        socket.emit('reject_call', {
          callId: inCall.callId,
          reason
        });
      }

      setIncomingCall(null);
    } catch (err) {
      console.error('Reject call error:', err);
    }
  }, [getSocket]);

  // End call
  const endCall = useCallback(async (autoEnd = false) => {
    try {
      if (!callIdRef.current) return;

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Try API first
      try {
        await AudioCallService.endCall(callId, callDuration, connectionQuality);
      } catch (e) { console.error('API end call failed', e); }

      const socket = getSocket();
      if (socket) {
        console.log('📤 [Caller] Emitting end_call to server for call:', callIdRef.current);
        socket.emit('end_call', { callId: callIdRef.current, quality: connectionQuality });
      }

      setCallState('ended');

      // Show ended state briefly
      setTimeout(() => {
        cleanup();
      }, 2000);
    } catch (err) {
      console.error('End call error:', err);
      cleanup();
    }
  }, [callId, callDuration, connectionQuality, getSocket, cleanup]);

  // Handlers
  const startDurationTimer = () => {
    try {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        console.log('⏱️ [Timer] Cleared existing interval');
      }

      console.log('⏱️ [Timer] Starting new duration timer');
      durationIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const duration = Math.floor((Date.now() - startTimeRef.current) / 1000);
          setCallDuration(duration);
        }
      }, 1000);
    } catch (err) {
      console.error('❌ Error starting duration timer:', err);
    }
  };

  const handleCallAccepted = (data) => {
    try {
      console.log('✅ [Caller] Call accepted notification received', data);

      // Robust comparison using String to handle ID type mismatches
      if (!data || !callIdRef.current || String(data.callId) !== String(callIdRef.current)) {
        console.warn(`⚠️ [Caller] Call ID mismatch or missing. Received: ${data?.callId}, Current: ${callIdRef.current}`);

        // If we are definitely in 'calling' state and received *any* acceptance, 
        // it's highly likely for this call if we just have one active call.
        // But for safety, we only proceed if IDs roughly match or if we force it.
        if (callState === 'calling' && data?.callId && !callIdRef.current) {
          console.log('⚠️ [Caller] Accepting matching call ID implicitly as we have none set but are calling');
          setCallId(data.callId);
          callIdRef.current = data.callId;
        } else {
          return;
        }
      }

      console.log('🟢 [Caller] Starting timer - call is connected');
      // Set connected state and start timer IMMEDIATELY for caller
      setCallState('connected');

      // Ensure we don't restart if already running
      if (!durationIntervalRef.current) {
        startTimeRef.current = Date.now();
        startDurationTimer();
        console.log('⏱️ [Caller] Timer started at:', new Date().toISOString());
      } else {
        console.log('⏱️ [Caller] Timer already running, skipping start');
      }
    } catch (err) {
      console.error('❌ Error in handleCallAccepted:', err);
    }
  };

  // Add backup listener for webrtc answer/ice candidate to implicitly transition to connected
  // This helps if the call_accepted event is missed but WebRTC negotiation proceeds
  const ensureConnectedState = () => {
    if (callState === 'calling') {
      console.log('🛡️ [Caller] WebRTC activity detected while calling -> forcing connected state');
      setCallState('connected');
      if (!durationIntervalRef.current) {
        startTimeRef.current = Date.now();
        startDurationTimer();
      }
    }
  };

  const handleRemoteCallEnded = (data) => {
    try {
      console.log('📴 [Remote End] Call ended event received', data);

      // Check if this matches our current call OR incoming call
      const isCurrentCall = data && callIdRef.current && String(data.callId) === String(callIdRef.current);
      // Relaxed check for incoming call: if we have any incoming call and receive an end event, 
      // it's very likely the one ringing.
      const isIncomingCall = data && incomingCall && (String(data.callId) === String(incomingCall.callId));

      if (!isCurrentCall && !isIncomingCall) {
        // Special case: If we have an incoming call but the ID doesn't match perfectly, 
        // we should probably still close it if we receive *any* call_ended event directed at us,
        // because we can't be in multiple calls at once.
        if (incomingCall) {
          console.log(`⚠️ [Remote End] Closing mismatched incoming call ${incomingCall.callId} due to end event ${data?.callId}`);
          setIncomingCall(null);
          return;
        }

        // If we really have no relation to this call, ignore
        if (callIdRef.current) {
          console.warn(`⚠️ [Remote End] Call ID mismatch - ignoring. Received: ${data?.callId}`);
        }
        return;
      }

      console.log('🛑 [Remote End] Other party ended call, closing UI');
      setCallState('ended');

      // IMPORTANT: Clear incoming call immediately if the caller cancelled before we accepted
      if (isIncomingCall) {
        console.log('🛑 [Remote End] Clearing incoming call notification');
        setIncomingCall(null);
      }
      setCallState('ended');

      // IMPORTANT: Clear incoming call immediately if the caller cancelled before we accepted
      if (isIncomingCall) {
        setIncomingCall(null);
      }

      // show ended state briefly then cleanup
      setTimeout(() => {
        console.log('🧹 [Cleanup] Cleaning up after remote end');
        cleanup();
      }, 1500);
    } catch (err) {
      console.error('❌ Error in handleRemoteCallEnded:', err);
    }
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

  const handleWebRTCOffer = async (data) => {
    try {
      if (data.callId !== callIdRef.current) return;

      // Implicitly ensure state is connected if we are receiving offers
      ensureConnectedState();

      if (!peerConnectionRef.current) return;

      const pc = peerConnectionRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(data.offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      const socket = getSocket();
      if (socket) {
        socket.emit('webrtc_answer', {
          callId: callIdRef.current,
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
      if (data.callId !== callIdRef.current) return;

      // Implicit check for caller
      ensureConnectedState();

      if (!peerConnectionRef.current) return;

      const pc = peerConnectionRef.current;
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
    } catch (err) {
      setError('Lỗi xử lý answer: ' + err.message);
      console.error('Handle answer error:', err);
    }
  };

  const handleICECandidate = (data) => {
    if (data.callId !== callIdRef.current) return;

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

  // Setup incoming call listener
  useEffect(() => {
    console.log('🔌 Setting up incoming_call listener via custom event');

    const handleIncomingCall = (event) => {
      console.log('📱 Incoming call received via custom event:', event.detail);
      setIncomingCall(event.detail);
      // Set remote user info from incoming call (caller)
      if (event.detail?.caller) {
        setRemoteUserInfo(event.detail.caller);
      }
    };

    // Listen to custom event dispatched by SocketContext
    window.addEventListener('socket_incoming_call', handleIncomingCall);

    // Also register global listeners for acceptance and remote end so caller/callee always react
    const handleGlobalCallAccepted = (e) => handleCallAccepted(e.detail);
    const handleGlobalCallEnded = (e) => handleRemoteCallEnded(e.detail);
    const handleGlobalCallAcceptedSelf = (e) => {
      // callee confirmation - ensure timer running
      try {
        if (!durationIntervalRef.current) {
          startTimeRef.current = Date.now();
          startDurationTimer();
        }
      } catch (err) { console.error('Error in handleGlobalCallAcceptedSelf:', err); }
    };

    window.addEventListener('socket_call_accepted', handleGlobalCallAccepted);
    window.addEventListener('socket_call_ended', handleGlobalCallEnded);
    window.addEventListener('socket_call_accepted_self', handleGlobalCallAcceptedSelf);

    return () => {
      console.log('🔌 Removing incoming_call listener');
      window.removeEventListener('socket_incoming_call', handleIncomingCall);
      window.removeEventListener('socket_call_accepted', handleGlobalCallAccepted);
      window.removeEventListener('socket_call_ended', handleGlobalCallEnded);
      window.removeEventListener('socket_call_accepted_self', handleGlobalCallAcceptedSelf);
    };
  }, []);

  return {
    // State
    callState,
    callId,
    callDuration,
    isInitiator,
    incomingCall,
    error,
    loading,
    error,
    loading,
    connectionQuality,
    remoteUserInfo,

    // Methods
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
    cleanup,

    // Refs (for external access if needed)
    peerConnectionRef,
    localStreamRef
  };
};

export default useAudioCall;
