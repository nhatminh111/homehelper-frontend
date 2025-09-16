import api from './api';

class MessageService {
  // Lấy tin nhắn theo ID
  static async getMessage(messageId) {
    try {
      const response = await api.get(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy tin nhắn:', error);
      throw error;
    }
  }

  // Cập nhật tin nhắn
  static async updateMessage(messageId, updateData) {
    try {
      const response = await api.put(`/messages/${messageId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật tin nhắn:', error);
      throw error;
    }
  }

  // Xóa tin nhắn
  static async deleteMessage(messageId) {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa tin nhắn:', error);
      throw error;
    }
  }

  // Xóa vĩnh viễn tin nhắn (Admin only)
  static async permanentDeleteMessage(messageId) {
    try {
      const response = await api.delete(`/messages/${messageId}/permanent`);
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa vĩnh viễn tin nhắn:', error);
      throw error;
    }
  }

  // Đếm tin nhắn chưa đọc
  static async countUnreadMessages(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/unread/count`);
      return response.data;
    } catch (error) {
      console.error('Lỗi đếm tin nhắn chưa đọc:', error);
      throw error;
    }
  }

  // Lấy tin nhắn chưa đọc
  static async getUnreadMessages(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/unread`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy tin nhắn chưa đọc:', error);
      throw error;
    }
  }

  // Lấy tin nhắn mới nhất
  static async getLatestMessage(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/latest`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy tin nhắn mới nhất:', error);
      throw error;
    }
  }

  // Upload file (hình ảnh, tài liệu)
  static async uploadFile(conversationId, formData) {
    try {
      const response = await api.post(`/messages/conversations/${conversationId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi upload file:', error);
      throw error;
    }
  }

  // Lấy tin nhắn theo khoảng thời gian
  static async getMessagesByDateRange(conversationId, startDate, endDate, page = 1, limit = 50) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/date-range`, {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          page,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy tin nhắn theo khoảng thời gian:', error);
      throw error;
    }
  }

  // Lấy tin nhắn đã ghim
  static async getPinnedMessages(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/pinned`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy tin nhắn đã ghim:', error);
      throw error;
    }
  }

  // Ghim/bỏ ghim tin nhắn
  static async togglePinMessage(messageId) {
    try {
      const response = await api.post(`/messages/${messageId}/pin`);
      return response.data;
    } catch (error) {
      console.error('Lỗi ghim/bỏ ghim tin nhắn:', error);
      throw error;
    }
  }

  // Phản hồi tin nhắn
  static async replyToMessage(messageId, replyData) {
    try {
      const response = await api.post(`/messages/${messageId}/reply`, replyData);
      return response.data;
    } catch (error) {
      console.error('Lỗi phản hồi tin nhắn:', error);
      throw error;
    }
  }

  // Lấy lịch sử chỉnh sửa tin nhắn
  static async getMessageEditHistory(messageId) {
    try {
      const response = await api.get(`/messages/${messageId}/edit-history`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy lịch sử chỉnh sửa tin nhắn:', error);
      throw error;
    }
  }

  // Báo cáo tin nhắn
  static async reportMessage(messageId, reportData) {
    try {
      const response = await api.post(`/messages/${messageId}/report`, reportData);
      return response.data;
    } catch (error) {
      console.error('Lỗi báo cáo tin nhắn:', error);
      throw error;
    }
  }

  // Lấy thống kê tin nhắn
  static async getMessageStats(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thống kê tin nhắn:', error);
      throw error;
    }
  }

  // Tìm kiếm tin nhắn toàn cục
  static async searchGlobalMessages(query, page = 1, limit = 20) {
    try {
      const response = await api.get(`/messages/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi tìm kiếm tin nhắn toàn cục:', error);
      throw error;
    }
  }

  // Lấy tin nhắn đã lưu
  static async getSavedMessages(page = 1, limit = 20) {
    try {
      const response = await api.get(`/messages/saved?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy tin nhắn đã lưu:', error);
      throw error;
    }
  }

  // Lưu/bỏ lưu tin nhắn
  static async toggleSaveMessage(messageId) {
    try {
      const response = await api.post(`/messages/${messageId}/save`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lưu/bỏ lưu tin nhắn:', error);
      throw error;
    }
  }
}

export default MessageService;
