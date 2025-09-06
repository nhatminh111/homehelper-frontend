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
      this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001', {
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

  // Event listener management
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.eventListeners.has(event)) {
      return;
    }

    const listeners = this.eventListeners.get(event);
    const index = listeners.indexOf(callback);
    if (index > -1) {
      listeners.splice(index, 1);
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
