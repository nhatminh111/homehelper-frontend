import ConversationService from './conversationService';
import MessageService from './messageService';
import NotificationService from './notificationService';
import { useSocket } from '../contexts/SocketContext';

class ChatService {
  constructor() {
    this.conversationService = ConversationService;
    this.messageService = MessageService;
    this.notificationService = NotificationService;
  }

  // ==================== CONVERSATION METHODS ====================

  // Tạo cuộc trò chuyện trực tiếp
  async createDirectConversation(userId) {
    return await this.conversationService.createDirectConversation(userId);
  }

  // Tạo cuộc trò chuyện nhóm
  async createGroupConversation(title, participants) {
    return await this.conversationService.createGroupConversation(title, participants);
  }

  // Lấy danh sách cuộc trò chuyện
  async getConversations(page = 1, limit = 20) {
    return await this.conversationService.getConversations(page, limit);
  }

  // Lấy chi tiết cuộc trò chuyện
  async getConversationById(conversationId) {
    return await this.conversationService.getConversationById(conversationId);
  }

  // Cập nhật cuộc trò chuyện
  async updateConversation(conversationId, updateData) {
    return await this.conversationService.updateConversation(conversationId, updateData);
  }

  // Xóa cuộc trò chuyện
  async deleteConversation(conversationId) {
    return await this.conversationService.deleteConversation(conversationId);
  }

  // Thêm participant
  async addParticipant(conversationId, participantData) {
    return await this.conversationService.addParticipant(conversationId, participantData);
  }

  // Xóa participant
  async removeParticipant(conversationId, participantId) {
    return await this.conversationService.removeParticipant(conversationId, participantId);
  }

  // ==================== MESSAGE METHODS ====================

  // Lấy tin nhắn trong cuộc trò chuyện
  async getMessages(conversationId, page = 1, limit = 50, beforeMessageId = null) {
    return await this.conversationService.getMessages(conversationId, page, limit, beforeMessageId);
  }

  // Gửi tin nhắn text
  async sendTextMessage(conversationId, content, replyToMessageId = null) {
    const messageData = {
      content,
      message_type: 'text',
      reply_to_message_id: replyToMessageId
    };
    return await this.conversationService.sendMessage(conversationId, messageData);
  }

  // Gửi tin nhắn với file
  async sendFileMessage(conversationId, file, content = '', replyToMessageId = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('content', content);
    if (replyToMessageId) {
      formData.append('reply_to_message_id', replyToMessageId);
    }
    return await this.conversationService.sendMessageWithFile(conversationId, formData);
  }

  // Tìm kiếm tin nhắn
  async searchMessages(conversationId, query, page = 1, limit = 20) {
    return await this.conversationService.searchMessages(conversationId, query, page, limit);
  }

  // Cập nhật tin nhắn
  async updateMessage(messageId, content) {
    return await this.messageService.updateMessage(messageId, { content });
  }

  // Xóa tin nhắn
  async deleteMessage(messageId) {
    return await this.messageService.deleteMessage(messageId);
  }

  // Đánh dấu tin nhắn đã đọc
  async markMessagesAsRead(conversationId) {
    return await this.conversationService.markAsRead(conversationId);
  }

  // Lấy tin nhắn chưa đọc
  async getUnreadMessages(conversationId) {
    return await this.messageService.getUnreadMessages(conversationId);
  }

  // Đếm tin nhắn chưa đọc
  async countUnreadMessages(conversationId) {
    return await this.messageService.countUnreadMessages(conversationId);
  }

  // Lấy tin nhắn mới nhất
  async getLatestMessage(conversationId) {
    return await this.messageService.getLatestMessage(conversationId);
  }

  // ==================== NOTIFICATION METHODS ====================

  // Lấy danh sách thông báo
  async getNotifications(page = 1, limit = 20, filters = {}) {
    return await this.notificationService.getNotifications(page, limit, filters);
  }

  // Lấy thông báo chưa đọc
  async getUnreadNotifications(limit = 10) {
    return await this.notificationService.getUnreadNotifications(limit);
  }

  // Đếm thông báo chưa đọc
  async countUnreadNotifications() {
    return await this.notificationService.countUnreadNotifications();
  }

  // Đánh dấu thông báo đã đọc
  async markNotificationAsRead(notificationId) {
    return await this.notificationService.markAsRead(notificationId);
  }

  // Đánh dấu tất cả thông báo đã đọc
  async markAllNotificationsAsRead() {
    return await this.notificationService.markAllAsRead();
  }

  // Xóa thông báo
  async deleteNotification(notificationId) {
    return await this.notificationService.deleteNotification(notificationId);
  }

  // Xóa tất cả thông báo đã đọc
  async deleteReadNotifications() {
    return await this.notificationService.deleteReadNotifications();
  }

  // Lấy thống kê thông báo
  async getNotificationStats() {
    return await this.notificationService.getNotificationStats();
  }

  // ==================== UTILITY METHODS ====================

  // Lấy cuộc trò chuyện trực tiếp với user (tạo mới nếu chưa có)
  async getOrCreateDirectConversation(userId) {
    try {
      // Thử lấy cuộc trò chuyện hiện có
      return await this.conversationService.getDirectConversation(userId);
    } catch (error) {
      // Nếu không có, tạo mới
      if (error.response?.status === 404) {
        return await this.createDirectConversation(userId);
      }
      throw error;
    }
  }

  // Lấy cuộc trò chuyện hỗ trợ (tạo mới nếu chưa có)
  async getOrCreateSupportConversation() {
    try {
      return await this.conversationService.getSupportConversation();
    } catch (error) {
      if (error.response?.status === 404) {
        // Tạo cuộc trò chuyện hỗ trợ mới
        const conversationData = {
          title: 'Hỗ trợ khách hàng',
          type: 'support',
          participants: [] // Sẽ được thêm admin tự động
        };
        return await this.conversationService.createConversation(conversationData);
      }
      throw error;
    }
  }

  // Tìm kiếm cuộc trò chuyện
  async searchConversations(query, page = 1, limit = 20) {
    try {
      const response = await this.conversationService.getConversations(page, limit);
      // Filter conversations by title or participants
      const filteredConversations = response.conversations.filter(conv => 
        conv.title?.toLowerCase().includes(query.toLowerCase()) ||
        conv.participants?.some(p => p.name?.toLowerCase().includes(query.toLowerCase()))
      );
      return {
        ...response,
        conversations: filteredConversations
      };
    } catch (error) {
      console.error('Lỗi tìm kiếm cuộc trò chuyện:', error);
      throw error;
    }
  }

  // Lấy thống kê tổng quan
  async getChatStats() {
    try {
      const [conversationStats, notificationStats] = await Promise.all([
        this.conversationService.getConversationStats(),
        this.getNotificationStats()
      ]);
      
      return {
        conversations: conversationStats,
        notifications: notificationStats
      };
    } catch (error) {
      console.error('Lỗi lấy thống kê chat:', error);
      throw error;
    }
  }

  // ==================== FILE UPLOAD METHODS ====================

  // Upload hình ảnh
  async uploadImage(conversationId, file, content = '') {
    if (!file.type.startsWith('image/')) {
      throw new Error('File phải là hình ảnh');
    }
    return await this.sendFileMessage(conversationId, file, content);
  }

  // Upload tài liệu
  async uploadDocument(conversationId, file, content = '') {
    if (file.type.startsWith('image/')) {
      throw new Error('Sử dụng uploadImage cho hình ảnh');
    }
    return await this.sendFileMessage(conversationId, file, content);
  }

  // ==================== REAL-TIME METHODS ====================

  // Join conversation room (Socket.IO)
  joinConversation(conversationId) {
    // This should be called from a React component with useSocket hook
    console.log('Join conversation:', conversationId);
  }

  // Leave conversation room (Socket.IO)
  leaveConversation(conversationId) {
    // This should be called from a React component with useSocket hook
    console.log('Leave conversation:', conversationId);
  }

  // Send message via Socket.IO
  sendRealtimeMessage(conversationId, content, messageType = 'text', replyToMessageId = null) {
    // This should be called from a React component with useSocket hook
    console.log('Send realtime message:', { conversationId, content, messageType, replyToMessageId });
  }

  // Start typing indicator
  startTyping(conversationId) {
    // This should be called from a React component with useSocket hook
    console.log('Start typing:', conversationId);
  }

  // Stop typing indicator
  stopTyping(conversationId) {
    // This should be called from a React component with useSocket hook
    console.log('Stop typing:', conversationId);
  }
}

// Tạo singleton instance
const chatService = new ChatService();

export default chatService;
