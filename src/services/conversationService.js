import api from '../services/api';

class ConversationService {
  // Tạo cuộc trò chuyện mới
  static async createConversation(conversationData) {
    try {
      const response = await api.post('/conversations', conversationData);
      return response.data.conversation || response.data;
    } catch (error) {
      console.error('Lỗi tạo cuộc trò chuyện:', error);
      throw error;
    }
  }

  // Lấy danh sách cuộc trò chuyện
  static async getConversations(page = 1, limit = 20) {
    try {
      const response = await api.get(`/conversations?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách cuộc trò chuyện:', error);
      throw error;
    }
  }

  // Lấy chi tiết cuộc trò chuyện
  static async getConversationById(conversationId) {
    try {
      const response = await api.get(`/conversations/${conversationId}`);
      return response.data.conversation || response.data;
    } catch (error) {
      console.error('Lỗi lấy chi tiết cuộc trò chuyện:', error);
      throw error;
    }
  }

  // Cập nhật cuộc trò chuyện
  static async updateConversation(conversationId, updateData) {
    try {
      const response = await api.put(`/conversations/${conversationId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật cuộc trò chuyện:', error);
      throw error;
    }
  }

  // Xóa cuộc trò chuyện
  static async deleteConversation(conversationId) {
    try {
      const response = await api.delete(`/conversations/${conversationId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa cuộc trò chuyện:', error);
      throw error;
    }
  }

  // Thêm participant
  static async addParticipant(conversationId, participantData) {
    try {
      const response = await api.post(`/conversations/${conversationId}/participants`, participantData);
      return response.data;
    } catch (error) {
      console.error('Lỗi thêm participant:', error);
      throw error;
    }
  }

  // Xóa participant
  static async removeParticipant(conversationId, participantId) {
    try {
      const response = await api.delete(`/conversations/${conversationId}/participants/${participantId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa participant:', error);
      throw error;
    }
  }

  // Lấy tin nhắn trong cuộc trò chuyện
  static async getMessages(conversationId, page = 1, limit = 50, beforeMessageId = null) {
    try {
      let url = `/conversations/${conversationId}/messages?page=${page}&limit=${limit}`;
      if (beforeMessageId) {
        url += `&beforeMessageId=${beforeMessageId}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy tin nhắn:', error);
      throw error;
    }
  }

  // Gửi tin nhắn (text)
  static async sendMessage(conversationId, messageData) {
    try {
      const response = await api.post(`/conversations/${conversationId}/messages`, messageData);
      return response.data;
    } catch (error) {
      console.error('Lỗi gửi tin nhắn:', error);
      throw error;
    }
  }

  // Gửi tin nhắn với file
  static async sendMessageWithFile(conversationId, formData) {
    try {
      const response = await api.post(`/conversations/${conversationId}/messages`, formData);
      return response.data;
    } catch (error) {
      console.error('Lỗi gửi tin nhắn với file:', error);
      throw error;
    }
  }

  // Tìm kiếm tin nhắn
  static async searchMessages(conversationId, query, page = 1, limit = 20) {
    try {
      const response = await api.get(`/conversations/${conversationId}/messages/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi tìm kiếm tin nhắn:', error);
      throw error;
    }
  }

  // Đánh dấu đã đọc
  static async markAsRead(conversationId) {
    try {
      const response = await api.post(`/conversations/${conversationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Lỗi đánh dấu đã đọc:', error);
      throw error;
    }
  }

  // Tạo cuộc trò chuyện trực tiếp với user
  static async createDirectConversation(userId) {
    try {
      const conversationData = {
        type: 'direct',
        participants: [userId]
      };
      return await this.createConversation(conversationData);
    } catch (error) {
      console.error('Lỗi tạo cuộc trò chuyện trực tiếp:', error);
      throw error;
    }
  }

  // Tạo cuộc trò chuyện nhóm
  static async createGroupConversation(title, participants) {
    try {
      const conversationData = {
        title,
        type: 'group',
        participants
      };
      return await this.createConversation(conversationData);
    } catch (error) {
      console.error('Lỗi tạo cuộc trò chuyện nhóm:', error);
      throw error;
    }
  }

  // Lấy cuộc trò chuyện trực tiếp với user
  static async getDirectConversation(userId) {
    try {
      const response = await api.get(`/conversations/direct/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy cuộc trò chuyện trực tiếp:', error);
      throw error;
    }
  }

  // Lấy cuộc trò chuyện hỗ trợ
  static async getSupportConversation() {
    try {
      const response = await api.get('/conversations/support');
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy cuộc trò chuyện hỗ trợ:', error);
      throw error;
    }
  }

  // Lấy thống kê cuộc trò chuyện
  static async getConversationStats() {
    try {
      const response = await api.get('/conversations/stats');
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thống kê cuộc trò chuyện:', error);
      throw error;
    }
  }
}

export default ConversationService;
