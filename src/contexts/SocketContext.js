import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import socketService from '../services/socketService';

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Map());
  const [unreadCount, setUnreadCount] = useState(0);

  // Kết nối socket khi user đăng nhập
  useEffect(() => {
    const authed = (typeof isAuthenticated === 'function') ? isAuthenticated() : !!(isAuthenticated && token && user);
    if (authed) {
      console.log('🔌 Connecting socket for user:', user.user_id);
      socketService.connect(token);
    } else {
      console.log('🔌 Disconnecting socket - user not authenticated');
      socketService.disconnect();
      setConnectionStatus('disconnected');
      setOnlineUsers(new Set());
      setTypingUsers(new Map());
      setUnreadCount(0);
    }
  }, [isAuthenticated, token, user]);

  // Thiết lập event listeners (bao gồm cả online_users)
  useEffect(() => {
    socketService.on('online_users', (userIds) => {
      setOnlineUsers(new Set(userIds));
    });
    // Connection status
    socketService.on('connection_status', (data) => {
      setConnectionStatus(data.status);
      console.log('🔌 Socket status:', data.status);
    });

    // New message
    socketService.on('new_message', (data) => {
      // Có thể emit event để các component khác lắng nghe
      window.dispatchEvent(new CustomEvent('socket_new_message', { detail: data }));
    });

    // User joined/left
    socketService.on('user_joined', (data) => {
      setOnlineUsers(prev => new Set([...prev, data.userId]));
      window.dispatchEvent(new CustomEvent('socket_user_joined', { detail: data }));
    });

    socketService.on('user_left', (data) => {
      setOnlineUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userId);
        return newSet;
      });
      window.dispatchEvent(new CustomEvent('socket_user_left', { detail: data }));
    });

    // Typing indicators
    socketService.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const newMap = new Map(prev);
        if (data.isTyping) {
          newMap.set(data.userId, {
            userName: data.userName,
            conversationId: data.conversationId,
            timestamp: Date.now()
          });
        } else {
          newMap.delete(data.userId);
        }
        return newMap;
      });
      window.dispatchEvent(new CustomEvent('socket_user_typing', { detail: data }));
    });

    // Message read
    socketService.on('message_read', (data) => {
      window.dispatchEvent(new CustomEvent('socket_message_read', { detail: data }));
    });

    // Message updated
    socketService.on('message_updated', (data) => {
      window.dispatchEvent(new CustomEvent('socket_message_updated', { detail: data }));
    });

    // New notification
    socketService.on('new_notification', (data) => {
      // Normalize payload
      const notification = (data && data.notification) ? data.notification : data;
      // Only process if notification targets current user
      try {
        const recipientId = notification.user_id ?? notification.recipient_id ?? notification.target_user_id;
        const currentUserId = (user && (user.user_id ?? user.userId));
        if (recipientId && currentUserId && String(recipientId) !== String(currentUserId)) {
          return; // ignore notifications not for this user
        }
      } catch (_) { }

      setUnreadCount(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('socket_new_notification', { detail: { notification } }));
    });

    // Unread count updates from server (after mark-as-read etc.)
    socketService.on('notifications_unread_count', (data) => {
      try {
        const count = typeof data === 'number' ? data : (data && data.unread) ? data.unread : 0;
        setUnreadCount(count);
        window.dispatchEvent(new CustomEvent('socket_notifications_unread_count', { detail: { unread: count } }));
      } catch (_) {
        // no-op
      }
    });

    // SOS events (Tasker receives new SOS job)
    socketService.on('new_sos_job', (data) => {
      console.log('🔔 socket new_sos_job event:', data);
      // Cập nhật unreadCount khi nhận được SOS job mới
      setUnreadCount(prev => prev + 1);
      window.dispatchEvent(new CustomEvent('socket_new_sos_job', { detail: data }));
    });

    // When customer receives confirmation of created sos job
    socketService.on('sos_job_created', (data) => {
      console.log('🔔 socket sos_job_created event:', data);
      window.dispatchEvent(new CustomEvent('socket_sos_job_created', { detail: data }));
    });

    // When a tasker accepts an sos job (broadcast to all)
    socketService.on('sos_job_taken', (data) => {
      console.log('🔔 socket sos_job_taken event:', data);
      window.dispatchEvent(new CustomEvent('socket_sos_job_taken', { detail: data }));
    });

    socketService.on('sos_job_accepted', (data) => {
      console.log('🔔 socket sos_job_accepted event:', data);
      window.dispatchEvent(new CustomEvent('socket_sos_job_accepted', { detail: data }));
    });

    socketService.on('sos_accept_success', (data) => {
      console.log('🔔 socket sos_accept_success event:', data);
      window.dispatchEvent(new CustomEvent('socket_sos_accept_success', { detail: data }));
    });

    socketService.on('sos_accept_failed', (data) => {
      console.log('🔔 socket sos_accept_failed event:', data);
      window.dispatchEvent(new CustomEvent('socket_sos_accept_failed', { detail: data }));
    });

    // Audio call events
    console.log('🔔 [SocketContext] Registering incoming_call listener');
    socketService.on('incoming_call', (data) => {
      console.log('📱 SocketContext received incoming_call:', data);
      window.dispatchEvent(new CustomEvent('socket_incoming_call', { detail: data }));
    });

    socketService.on('call_accepted', (data) => {
      console.log('✅ SocketContext received call_accepted:', data);
      window.dispatchEvent(new CustomEvent('socket_call_accepted', { detail: data }));
    });

    socketService.on('call_rejected', (data) => {
      console.log('❌ SocketContext received call_rejected:', data);
      window.dispatchEvent(new CustomEvent('socket_call_rejected', { detail: data }));
    });

    socketService.on('call_ended', (data) => {
      console.log('📞 SocketContext received call_ended:', data);
      window.dispatchEvent(new CustomEvent('socket_call_ended', { detail: data }));
    });

    socketService.on('webrtc_offer', (data) => {
      console.log('🔊 SocketContext received webrtc_offer:', data);
      window.dispatchEvent(new CustomEvent('socket_webrtc_offer', { detail: data }));
    });

    socketService.on('webrtc_answer', (data) => {
      console.log('🔊 SocketContext received webrtc_answer:', data);
      window.dispatchEvent(new CustomEvent('socket_webrtc_answer', { detail: data }));
    });

    socketService.on('ice_candidate', (data) => {
      console.log('❄️ SocketContext received ice_candidate:', data);
      window.dispatchEvent(new CustomEvent('socket_ice_candidate', { detail: data }));
    });

    // Forward callee-specific and self events for redundancy
    socketService.on('call_accepted_self', (data) => {
      console.log('✅ SocketContext received call_accepted_self:', data);
      window.dispatchEvent(new CustomEvent('socket_call_accepted_self', { detail: data }));
    });

    socketService.on('call_ended_self', (data) => {
      console.log('📞 SocketContext received call_ended_self:', data);
      window.dispatchEvent(new CustomEvent('socket_call_ended_self', { detail: data }));
    });

    // User status changed
    socketService.on('user_status_changed', (data) => {
      if (data.status === 'online') {
        setOnlineUsers(prev => new Set([...prev, data.userId]));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(data.userId);
          return newSet;
        });
      }
      window.dispatchEvent(new CustomEvent('socket_user_status_changed', { detail: data }));
    });

    // Socket errors
    socketService.on('socket_error', (error) => {
      console.error('❌ Socket error:', error);
      window.dispatchEvent(new CustomEvent('socket_error', { detail: error }));
    });

    // After registering listeners, sync current status to avoid missing early connect event
    try {
      const status = socketService.getConnectionStatus();
      if (status?.isConnected) {
        setConnectionStatus('connected');
      }
    } catch (_) { }

    // Cleanup function
    return () => {
      socketService.off('connection_status');
      socketService.off('new_message');
      socketService.off('user_joined');
      socketService.off('user_left');
      socketService.off('user_typing');
      socketService.off('message_read');
      socketService.off('message_updated');
      socketService.off('new_notification');
      socketService.off('notifications_unread_count');
      socketService.off('user_status_changed');
      socketService.off('socket_error');
      socketService.off('online_users');
      socketService.off('new_sos_job');
      socketService.off('sos_job_created');
      socketService.off('sos_job_taken');
      socketService.off('sos_job_accepted');
      socketService.off('sos_accept_success');
      socketService.off('sos_accept_failed');
      // Audio call events
      socketService.off('incoming_call');
      socketService.off('call_accepted');
      socketService.off('call_rejected');
      socketService.off('call_ended');
      socketService.off('webrtc_offer');
      socketService.off('webrtc_answer');
      socketService.off('ice_candidate');
      socketService.off('call_accepted_self');
      socketService.off('call_ended_self');
    };
  }, []);

  // Cleanup typing users after timeout
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setTypingUsers(prev => {
        const newMap = new Map();
        for (const [userId, data] of prev) {
          if (now - data.timestamp < 5000) { // 5 seconds timeout
            newMap.set(userId, data);
          }
        }
        return newMap;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Socket methods
  const joinConversation = (conversationId) => {
    socketService.joinConversation(conversationId);
  };

  const leaveConversation = (conversationId) => {
    socketService.leaveConversation(conversationId);
  };

  const sendMessage = (conversationId, content, messageType = 'text', replyToMessageId = null) => {
    socketService.sendMessage(conversationId, content, messageType, replyToMessageId);
  };

  const startTyping = (conversationId) => {
    socketService.startTyping(conversationId);
  };

  // SOS helpers (front-end API)
  const createSOSJob = (payload) => {
    socketService.createSOSJob(payload);
  };

  const acceptSOSJob = (bookingId) => {
    socketService.acceptSOSJob(bookingId);
  };

  const stopTyping = (conversationId) => {
    socketService.stopTyping(conversationId);
  };

  const markMessageAsRead = (conversationId) => {
    socketService.markMessageAsRead(conversationId);
  };

  const markNotificationAsRead = (notificationId) => {
    socketService.markNotificationAsRead(notificationId);
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const isUserOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  const getTypingUsers = (conversationId) => {
    const users = [];
    for (const [userId, data] of typingUsers) {
      if (data.conversationId === conversationId) {
        users.push({ userId, userName: data.userName });
      }
    }
    return users;
  };

  const updateUnreadCount = (count) => {
    setUnreadCount(count);
  };

  const value = {
    // Connection status
    connectionStatus,
    isConnected: connectionStatus === 'connected',

    // Online users
    onlineUsers: Array.from(onlineUsers),
    isUserOnline,

    // Typing indicators
    typingUsers: Array.from(typingUsers.entries()),
    getTypingUsers,

    // Notifications
    unreadCount,
    updateUnreadCount,

    // Socket methods
    joinConversation,
    leaveConversation,
    sendMessage,
    startTyping,
    stopTyping,
    markMessageAsRead,
    markNotificationAsRead,
    // SOS
    createSOSJob,
    acceptSOSJob,

    // Utility
    getConnectionStatus: socketService.getConnectionStatus.bind(socketService),
    getSocket: () => socketService.getSocket()
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};