import io from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.eventListeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.desiredRooms = new Set(); // rooms to ensure we are joined to when connected
  }

  // Kết nối đến Socket.IO server
  connect(token) {
    if (this.socket && this.isConnected) {
      console.log('Socket already connected');
      return;
    }

    try {
      // Derive socket URL: Prefer REACT_APP_SOCKET_URL, then derived from REACT_APP_API_URL, then fallback to localhost
      const apiBase = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const defaultSocketUrl = apiBase.replace(/\/api\/?$/, '');
      const socketUrl = process.env.REACT_APP_SOCKET_URL || defaultSocketUrl;

      this.socket = io(socketUrl, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        forceNew: true,
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000
      });

      this.setupEventListeners();
      console.log('🔌 Connecting to Socket.IO server...');
    } catch (error) {
      console.error('❌ Socket connection error:', error);
    }
  }

  // Thiết lập event listeners
  setupEventListeners() {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('✅ Connected to Socket.IO server');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connection_status', { status: 'connected' });

      // Join any rooms requested while disconnected
      try {
        for (const conversationId of Array.from(this.desiredRooms)) {
          this.socket.emit('join_conversation', { conversationId });
          console.log(`👥 Re-joined conversation after connect: ${conversationId}`);
        }
      } catch (e) {
        console.error('❌ Failed to re-join rooms on connect:', e);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from Socket.IO server:', reason);
      this.isConnected = false;
      this.emit('connection_status', { status: 'disconnected', reason });

      // Auto reconnect if not manually disconnected
      if (reason !== 'io client disconnect') {
        this.handleReconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      this.emit('connection_error', error);
    });

    // Chat events
    this.socket.on('new_message', (data) => {
      console.log('💬 New message received:', data);
      this.emit('new_message', data);
    });

    // SOS events
    this.socket.on('new_sos_job', (data) => {
      console.log('🚨 New SOS job:', data);
      this.emit('new_sos_job', data);
      // Dispatch window event for TaskerBookings
      window.dispatchEvent(new CustomEvent('socket_new_sos_job', { detail: data }));
    });

    this.socket.on('sos_job_created', (data) => {
      console.log('✅ SOS job created:', data);
      this.emit('sos_job_created', data);
      // Dispatch window event for TaskerSearch
      window.dispatchEvent(new CustomEvent('socket_sos_job_created', { detail: data }));
    });

    this.socket.on('sos_job_accepted', (data) => {
      console.log('🎉 SOS job accepted (customer notified):', data);
      this.emit('sos_job_accepted', data);
      // Dispatch window event for TaskerSearch and other components
      window.dispatchEvent(new CustomEvent('socket_sos_job_accepted', { detail: data }));
    });

    this.socket.on('sos_job_taken', (data) => {
      console.log('🔒 SOS job taken:', data);
      this.emit('sos_job_taken', data);
      // Dispatch window event for TaskerBookings and other components
      window.dispatchEvent(new CustomEvent('socket_sos_job_taken', { detail: data }));
    });

    this.socket.on('sos_accept_success', (data) => {
      console.log('✅ SOS accept success:', data);
      this.emit('sos_accept_success', data);
      // Dispatch window event for TaskerBookingDetail and other components
      window.dispatchEvent(new CustomEvent('socket_sos_accept_success', { detail: data }));
    });

    this.socket.on('sos_accept_failed', (data) => {
      console.log('❌ SOS accept failed:', data);
      this.emit('sos_accept_failed', data);
      // Dispatch window event for TaskerBookingDetail and other components
      window.dispatchEvent(new CustomEvent('socket_sos_accept_failed', { detail: data }));
    });

    this.socket.on('user_joined', (data) => {
      console.log('👥 User joined:', data);
      this.emit('user_joined', data);
    });

    this.socket.on('user_left', (data) => {
      console.log('👋 User left:', data);
      this.emit('user_left', data);
    });

    this.socket.on('user_typing', (data) => {
      console.log('⌨️ User typing:', data);
      this.emit('user_typing', data);
    });

    this.socket.on('message_read', (data) => {
      console.log('👁️ Message read:', data);
      this.emit('message_read', data);
    });

    // Message updated
    this.socket.on('message_updated', (data) => {
      console.log('✏️ Message updated:', data);
      this.emit('message_updated', data);
    });

    // Notification events
    this.socket.on('new_notification', (data) => {
      console.log('🔔 New notification:', data);
      this.emit('new_notification', data);
    });

    this.socket.on('user_status_changed', (data) => {
      console.log('🟢 User status changed:', data);
      this.emit('user_status_changed', data);
    });

    // Error events
    this.socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      this.emit('socket_error', error);
    });

    this.socket.on('online_users', (data) => {
      console.log('🟢 Online users list:', data);
      this.emit('online_users', data);
    });

    // Audio call events
    this.socket.on('incoming_call', (data) => {
      console.log('📱 Incoming call received:', data);
      this.emit('incoming_call', data);
    });

    this.socket.on('call_accepted', (data) => {
      console.log('✅ Call accepted (remote - for caller):', data);
      this.emit('call_accepted', data);
      // Dispatch window event for useAudioCall hook
      window.dispatchEvent(new CustomEvent('socket_call_accepted', { detail: data }));
    });

    this.socket.on('call_accepted_self', (data) => {
      console.log('✅ Call accepted self (callee confirmation):', data);
      this.emit('call_accepted_self', data);
      // Dispatch window event for useAudioCall hook
      window.dispatchEvent(new CustomEvent('socket_call_accepted_self', { detail: data }));
    });

    this.socket.on('call_rejected', (data) => {
      console.log('❌ Call rejected:', data);
      this.emit('call_rejected', data);
      // Dispatch window event
      window.dispatchEvent(new CustomEvent('socket_call_rejected', { detail: data }));
    });

    this.socket.on('call_rejected_self', (data) => {
      console.log('❌ Call rejected self:', data);
      this.emit('call_rejected_self', data);
      // Dispatch window event
      window.dispatchEvent(new CustomEvent('socket_call_rejected_self', { detail: data }));
    });

    this.socket.on('call_ended', (data) => {
      console.log('📞 Call ended:', data);
      this.emit('call_ended', data);
      // Dispatch window event for useAudioCall hook
      window.dispatchEvent(new CustomEvent('socket_call_ended', { detail: data }));
    });

    this.socket.on('call_ended_self', (data) => {
      console.log('📞 Call ended self:', data);
      this.emit('call_ended_self', data);
      // Dispatch window event
      window.dispatchEvent(new CustomEvent('socket_call_ended_self', { detail: data }));
    });

    this.socket.on('webrtc_offer', (data) => {
      console.log('🔊 WebRTC offer received:', data);
      this.emit('webrtc_offer', data);
      // Dispatch window event for useAudioCall hook
      window.dispatchEvent(new CustomEvent('socket_webrtc_offer', { detail: data }));
    });

    this.socket.on('webrtc_answer', (data) => {
      console.log('🔊 WebRTC answer received:', data);
      this.emit('webrtc_answer', data);
      // Dispatch window event for useAudioCall hook
      window.dispatchEvent(new CustomEvent('socket_webrtc_answer', { detail: data }));
    });

    this.socket.on('ice_candidate', (data) => {
      console.log('❄️ ICE candidate received:', data);
      this.emit('ice_candidate', data);
      // Dispatch window event for useAudioCall hook
      window.dispatchEvent(new CustomEvent('socket_ice_candidate', { detail: data }));
    });

    this.socket.on('call_error', (data) => {
      console.log('❌ Call error:', data);
      this.emit('call_error', data);
      // Dispatch window event for useAudioCall hook
      window.dispatchEvent(new CustomEvent('socket_call_error', { detail: data }));
    });
  }

  // Xử lý reconnect
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnect attempts reached');
      this.emit('connection_status', { status: 'failed' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    console.log(`🔄 Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    setTimeout(() => {
      if (this.socket && !this.isConnected) {
        this.socket.connect();
      }
    }, delay);
  }

  // Join conversation room
  joinConversation(conversationId) {
    if (!conversationId) return;
    // Remember desired room no matter what
    this.desiredRooms.add(conversationId);

    if (!this.socket || !this.isConnected) {
      console.log('⏳ Socket not connected yet, queue join:', conversationId);
      return;
    }

    this.socket.emit('join_conversation', { conversationId });
    console.log(`👥 Joining conversation: ${conversationId}`);
  }

  // Leave conversation room
  leaveConversation(conversationId) {
    if (!conversationId) return;
    // Remove from desired set so we don't re-join on connect
    this.desiredRooms.delete(conversationId);

    if (!this.socket || !this.isConnected) {
      console.log('⏳ Socket not connected; will not re-join this room:', conversationId);
      return;
    }

    this.socket.emit('leave_conversation', { conversationId });
    console.log(`👋 Leaving conversation: ${conversationId}`);
  }

  // Gửi tin nhắn
  sendMessage(conversationId, content, messageType = 'text', replyToMessageId = null) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected');
      return;
    }

    if (!content || content.trim().length === 0) {
      console.error('❌ Message content cannot be empty');
      return;
    }

    this.socket.emit('send_message', {
      conversationId,
      content: content.trim(),
      messageType,
      replyToMessageId
    });
    console.log(`💬 Sending message to conversation: ${conversationId}`);
  }

  // Bắt đầu typing
  startTyping(conversationId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('typing_start', { conversationId });
  }

  // Dừng typing
  stopTyping(conversationId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('typing_stop', { conversationId });
  }

  // Đánh dấu tin nhắn đã đọc
  markMessageAsRead(conversationId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('message_read', { conversationId });
  }

  // Đánh dấu thông báo đã đọc
  markNotificationAsRead(notificationId) {
    if (!this.socket || !this.isConnected) {
      return;
    }

    this.socket.emit('notification_read', { notificationId });
  }

  // SOS: tạo SOS job (khách hàng phát sóng)
  createSOSJob(payload) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected - cannot create SOS job');
      return;
    }
    this.socket.emit('create_sos_job', payload);
    console.log('🚀 Emitted create_sos_job', payload);
  }

  // SOS: tasker chấp nhận SOS job
  acceptSOSJob(bookingId) {
    if (!this.socket || !this.isConnected) {
      console.error('❌ Socket not connected - cannot accept SOS job');
      return;
    }
    this.socket.emit('accept_sos_job', { booking_id: bookingId });
    console.log('✅ Emitted accept_sos_job', bookingId);
  }

  // Event listener management

  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
    // IMPORTANT: Không gắn trực tiếp listener vào this.socket ở đây nữa.
    // Lý do: Các sự kiện từ server đã được forward một lần trong setupEventListeners()
    // bằng this.emit(). Nếu gắn thêm socket.on(event, callback) ở đây sẽ dẫn tới
    // callback chạy 2 lần (ví dụ new_message hiển thị 2 tin). Chúng ta chỉ lưu callback
    // vào bộ nhớ và để hàm emit() gọi.
  }

  off(event, callback) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    const listeners = this.eventListeners.get(event);
    if (callback) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    } else {
      // Xóa tất cả listener nếu không truyền callback
      this.eventListeners.set(event, []);
    }
  }

  emit(event, data) {
    if (!this.eventListeners.has(event)) {
      return;
    }
    this.eventListeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`❌ Error in event listener for ${event}:`, error);
      }
    });
    // Gửi event lên server nếu là sự kiện do client phát ra
    if (this.socket && [
      'join_conversation', 'leave_conversation', 'send_message', 'typing_start', 'typing_stop', 'message_read', 'notification_read'
    ].includes(event)) {
      this.socket.emit(event, data);
    }
  }

  // Ngắt kết nối
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.eventListeners.clear();
      console.log('🔌 Socket disconnected');
    }
  }

  // Kiểm tra trạng thái kết nối
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      socketId: this.socket?.id
    };
  }

  // Lấy socket instance (nếu cần)
  getSocket() {
    return this.socket;
  }
}

// Tạo singleton instance
const socketService = new SocketService();

export default socketService;