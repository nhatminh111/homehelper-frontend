import api from './api';

class NotificationService {
  // Lấy danh sách thông báo
  static async getNotifications(page = 1, limit = 20, filters = {}) {
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });
      
      const response = await api.get(`/notifications?${params}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy danh sách thông báo:', error);
      throw error;
    }
  }

  // Lấy thông báo theo ID
  static async getNotification(notificationId) {
    try {
      const response = await api.get(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông báo:', error);
      throw error;
    }
  }

  // Đánh dấu thông báo đã đọc
  static async markAsRead(notificationId) {
    try {
      const response = await api.post(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Lỗi đánh dấu thông báo đã đọc:', error);
      throw error;
    }
  }

  // Đánh dấu tất cả thông báo đã đọc
  static async markAllAsRead() {
    try {
      const response = await api.post('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Lỗi đánh dấu tất cả thông báo đã đọc:', error);
      throw error;
    }
  }

  // Xóa thông báo
  static async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa thông báo:', error);
      throw error;
    }
  }

  // Xóa tất cả thông báo đã đọc
  static async deleteReadNotifications() {
    try {
      const response = await api.delete('/notifications/read');
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa thông báo đã đọc:', error);
      throw error;
    }
  }

  // Đếm thông báo chưa đọc
  static async countUnreadNotifications() {
    try {
      const response = await api.get('/notifications/unread/count');
      return response.data;
    } catch (error) {
      console.error('Lỗi đếm thông báo chưa đọc:', error);
      throw error;
    }
  }

  // Lấy thông báo chưa đọc
  static async getUnreadNotifications(limit = 10) {
    try {
      const response = await api.get(`/notifications/unread?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông báo chưa đọc:', error);
      throw error;
    }
  }

  // Lấy thống kê thông báo
  static async getNotificationStats() {
    try {
      const response = await api.get('/notifications/stats');
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thống kê thông báo:', error);
      throw error;
    }
  }

  // Tạo thông báo mới (Admin only)
  static async createNotification(notificationData) {
    try {
      const response = await api.post('/notifications', notificationData);
      return response.data;
    } catch (error) {
      console.error('Lỗi tạo thông báo:', error);
      throw error;
    }
  }

  // Tạo thông báo cho nhiều user (Admin only)
  static async createNotificationsForUsers(notificationData) {
    try {
      const response = await api.post('/notifications/multiple', notificationData);
      return response.data;
    } catch (error) {
      console.error('Lỗi tạo thông báo cho nhiều user:', error);
      throw error;
    }
  }

  // Xóa thông báo hết hạn (Admin only)
  static async deleteExpiredNotifications() {
    try {
      const response = await api.delete('/notifications/expired');
      return response.data;
    } catch (error) {
      console.error('Lỗi xóa thông báo hết hạn:', error);
      throw error;
    }
  }

  // Lấy thông báo theo loại
  static async getNotificationsByType(type, page = 1, limit = 20) {
    try {
      const response = await api.get(`/notifications/type/${type}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông báo theo loại:', error);
      throw error;
    }
  }

  // Lấy thông báo theo khoảng thời gian
  static async getNotificationsByDateRange(startDate, endDate, page = 1, limit = 20) {
    try {
      const response = await api.get('/notifications/date-range', {
        params: {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          page,
          limit
        }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông báo theo khoảng thời gian:', error);
      throw error;
    }
  }

  // Tìm kiếm thông báo
  static async searchNotifications(query, page = 1, limit = 20) {
    try {
      const response = await api.get(`/notifications/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi tìm kiếm thông báo:', error);
      throw error;
    }
  }

  // Lấy thông báo quan trọng
  static async getImportantNotifications(page = 1, limit = 20) {
    try {
      const response = await api.get(`/notifications/important?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông báo quan trọng:', error);
      throw error;
    }
  }

  // Đánh dấu thông báo quan trọng
  static async markAsImportant(notificationId) {
    try {
      const response = await api.post(`/notifications/${notificationId}/important`);
      return response.data;
    } catch (error) {
      console.error('Lỗi đánh dấu thông báo quan trọng:', error);
      throw error;
    }
  }

  // Bỏ đánh dấu thông báo quan trọng
  static async unmarkAsImportant(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}/important`);
      return response.data;
    } catch (error) {
      console.error('Lỗi bỏ đánh dấu thông báo quan trọng:', error);
      throw error;
    }
  }

  // Lấy cài đặt thông báo
  static async getNotificationSettings() {
    try {
      const response = await api.get('/notifications/settings');
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy cài đặt thông báo:', error);
      throw error;
    }
  }

  // Cập nhật cài đặt thông báo
  static async updateNotificationSettings(settings) {
    try {
      const response = await api.put('/notifications/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Lỗi cập nhật cài đặt thông báo:', error);
      throw error;
    }
  }

  // Lấy thông báo theo conversation
  static async getNotificationsByConversation(conversationId, page = 1, limit = 20) {
    try {
      const response = await api.get(`/notifications/conversation/${conversationId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông báo theo conversation:', error);
      throw error;
    }
  }

  // Lấy thông báo theo user
  static async getNotificationsByUser(userId, page = 1, limit = 20) {
    try {
      const response = await api.get(`/notifications/user/${userId}?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi lấy thông báo theo user:', error);
      throw error;
    }
  }
}

export default NotificationService;
