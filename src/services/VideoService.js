import api from './api';

class VideoService {
  async getUserVideos(params = {}) {
    try {
      const response = await api.get('/videos/my-videos', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy video của người dùng:', error);
      throw error;
    }
  }

  async getVideoById(id) {
    try {
      const response = await api.get(`/videos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy video:', error);
      throw error;
    }
  }

  async uploadVideo(videoData) {
    try {
      const formData = new FormData();
      formData.append('video', videoData.video);
      formData.append('title', videoData.title);
      if (videoData.description) {
        formData.append('description', videoData.description);
      }

      const response = await api.post('/videos/upload', formData, {
        headers: {
          Authorization: api.getStoredToken() ? `Bearer ${api.getStoredToken()}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi upload video:', error);
      throw new Error(error.response?.data?.error || `Lỗi khi upload video: ${error.message}`);
    }
  }

  async updateVideo(videoId, videoData) {
    try {
      const formData = new FormData();
      formData.append('title', videoData.title);
      if (videoData.description) {
        formData.append('description', videoData.description);
      }
      if (videoData.video) {
        formData.append('video', videoData.video);
      }

      const response = await api.put(`/videos/${videoId}`, formData, {
        headers: {
          Authorization: api.getStoredToken() ? `Bearer ${api.getStoredToken()}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi cập nhật video:', error);
      throw new Error(
        error.response?.data?.error ||
        (error.response?.status === 401 || error.response?.status === 403
          ? 'Không có quyền: Vui lòng đăng nhập lại'
          : `Lỗi khi cập nhật video: ${error.message}`)
      );
    }
  }

  async deleteVideo(id) {
    try {
      const response = await api.delete(`/videos/${id}`, {
        headers: {
          Authorization: api.getStoredToken() ? `Bearer ${api.getStoredToken()}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa video:', error);
      throw new Error(error.response?.data?.error || `Lỗi khi xóa video: ${error.message}`);
    }
  }

  async getRecentVideos(limit = 5) {
    try {
      const response = await api.get('/videos/recent', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy video gần đây:', error);
      throw error;
    }
  }

  async getPopularVideos(limit = 5) {
    try {
      const response = await api.get('/videos/popular', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy video phổ biến:', error);
      throw error;
    }
  }

  async searchVideos(query, params = {}) {
    try {
      const response = await api.get('/videos/search', {
        params: { q: query, ...params },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tìm kiếm video:', error);
      throw error;
    }
  }

  async toggleLikeVideo(id, userId) {
    try {
      const response = await api.post(`/videos/${id}/like`, { user_id: userId });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi like/unlike video:', error);
      throw error;
    }
  }

  async isVideoLikedByUser(videoId, userId) {
    try {
      const response = await api.get(`/videos/${videoId}/likes`, {
        params: { user_id: userId },
      });
      return response.data.isLiked || false;
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái like video:', error);
      return false;
    }
  }

  async getStats() {
    try {
      const response = await api.get('/videos/stats');
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy thống kê video:', error);
      throw error;
    }
  }

  async getAllVideos(params = {}) {
    try {
      const response = await api.get('/videos/all-videos', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy tất cả video:', error);
      throw error;
    }
  }

  async getUserVideosById(userId, params = {}) {
    try {
      const response = await api.get(`/videos/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy video theo user:', error);
      throw error;
    }
  }

  async getPendingVideos(params = {}) {
    try {
      const response = await api.get('/videos/pending', { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy tất cả video cho Staff:', error);
      throw new Error(error.response?.data?.error || `Lỗi khi lấy tất cả video cho Staff: ${error.message}`);
    }
  }

  async updateVideoStatus(videoId, status) {
    try {
      const response = await api.put(`/videos/${videoId}/status`, { status }, {
        headers: {
          Authorization: api.getStoredToken() ? `Bearer ${api.getStoredToken()}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi cập nhật trạng thái video:', error);
      throw new Error(
        error.response?.data?.error ||
        (error.response?.status === 401 || error.response?.status === 403
          ? 'Không có quyền: Vui lòng đăng nhập lại'
          : `Lỗi khi cập nhật trạng thái video: ${error.message}`)
      );
    }
  }

  async createVideoComment(videoId, commentData) {
    try {
      const response = await api.post(`/videos/${videoId}/comments`, {
        video_id: videoId,
        content: commentData.content,
        parent_comment_id: commentData.parent_comment_id || null,
      }, {
        headers: {
          Authorization: api.getStoredToken() ? `Bearer ${api.getStoredToken()}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tạo comment:', error);
      throw new Error(
        error.response?.data?.error ||
        (error.response?.status === 401 || error.response?.status === 403
          ? 'Không có quyền: Vui lòng đăng nhập lại'
          : `Lỗi khi tạo comment: ${error.message}`)
      );
    }
  }

  async updateVideoComment(commentId, content) {
    try {
      const response = await api.put(`/videos/comments/${commentId}`, { content }, {
        headers: {
          Authorization: api.getStoredToken() ? `Bearer ${api.getStoredToken()}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi cập nhật comment:', error);
      throw new Error(
        error.response?.data?.error ||
        (error.response?.status === 401 || error.response?.status === 403
          ? 'Không có quyền: Vui lòng đăng nhập lại'
          : `Lỗi khi cập nhật comment: ${error.message}`)
      );
    }
  }

  async deleteVideoComment(commentId) {
    try {
      const response = await api.delete(`/videos/comments/${commentId}`, {
        headers: {
          Authorization: api.getStoredToken() ? `Bearer ${api.getStoredToken()}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi xóa comment:', error);
      throw new Error(
        error.response?.data?.error ||
        (error.response?.status === 401 || error.response?.status === 403
          ? 'Không có quyền: Vui lòng đăng nhập lại'
          : `Lỗi khi xóa comment: ${error.message}`)
      );
    }
  }

  async getVideoComments(videoId, params = {}) {
    try {
      const response = await api.get(`/videos/${videoId}/comments`, { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy comment video:', error);
      throw error;
    }
  }

  async getVideoCommentTree(videoId, params = {}) {
    try {
      const response = await api.get(`/videos/${videoId}/comments/tree`, { params });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy cây comment video:', error);
      throw error;
    }
  }
  static async deleteVideoByStaff(videoId) {
    try {
      const response = await api.delete(`/videos/${videoId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Lỗi khi xóa video');
    }
  }
}

export default new VideoService();