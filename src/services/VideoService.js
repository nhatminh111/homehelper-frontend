import api from './api';

class VideoService {
  async getUserVideos(params = {}) {
    try {
      const response = await api.get('/videos/my-videos', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user videos:', error);
      throw error;
    }
  }

  async getVideoById(id) {
    try {
      const response = await api.get(`/videos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching video:', error);
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
<<<<<<< Updated upstream
      console.error('Error uploading video:', error);
      throw error;
=======
      console.error( error);
      throw new Error(error.response?.data?.error || error.message);
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
>>>>>>> Stashed changes
    }
  }

  async deleteVideo(id) {
    try {
      const response = await api.delete(`/videos/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting video:', error);
      throw error;
    }
  }

  async getRecentVideos(limit = 5) {
    try {
      const response = await api.get('/videos/recent', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent videos:', error);
      throw error;
    }
  }

  async getPopularVideos(limit = 5) {
    try {
      const response = await api.get('/videos/popular', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular videos:', error);
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
      console.error('Error searching videos:', error);
      throw error;
    }
  }

  async toggleLikeVideo(id, userId) {
    try {
      const response = await api.post(`/videos/${id}/like`, { user_id: userId });
      return response.data;
    } catch (error) {
      console.error('Error toggling like on video:', error);
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
      console.error('Error checking like status on video:', error);
      return false;
    }
  }

  async getStats() {
    try {
      const response = await api.get('/videos/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching video stats:', error);
      throw error;
    }
  }

  async getAllVideos(params = {}) {
    try {
      const response = await api.get('/videos/all-videos', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching all videos:', error);
      throw error;
    }
  }

  async getUserVideosById(userId, params = {}) {
    try {
      const response = await api.get(`/videos/user/${userId}`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching videos by user:', error);
      throw error;
    }
  }

  async createVideoComment(videoId, commentData) {
    try {
      const response = await api.post(`/videos/${videoId}/comments`, {
        video_id: videoId,
        content: commentData.content,
        parent_comment_id: commentData.parent_comment_id || null
      }, {
        headers: {
          Authorization: api.getStoredToken() ? `Bearer ${api.getStoredToken()}` : undefined,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw new Error(error.response?.status === 401 || error.response?.status === 403
        ? 'Unauthorized: Please log in again'
        : `Failed to create comment: ${error.message}`);
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
      console.error('Error updating comment:', error);
      throw new Error(error.response?.status === 401 || error.response?.status === 403
        ? 'Unauthorized: Please log in again'
        : `Failed to update comment: ${error.message}`);
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
      console.error('Error deleting comment:', error);
      throw new Error(error.response?.status === 401 || error.response?.status === 403
        ? 'Unauthorized: Please log in again'
        : `Failed to delete comment: ${error.message}`);
    }
  }

  async getVideoComments(videoId, params = {}) {
    try {
      const response = await api.get(`/videos/${videoId}/comments`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching video comments:', error);
      throw error;
    }
  }

  async getVideoCommentTree(videoId, params = {}) {
    try {
      const response = await api.get(`/videos/${videoId}/comments/tree`, { params });
      return response.data; // Trả về dữ liệu trực tiếp từ API, đã được xử lý ở backend
    } catch (error) {
      console.error('Error fetching video comment tree:', error);
      throw error;
    }
  }
<<<<<<< Updated upstream
=======
// Xóa video bởi Staff
async deleteVideoByStaff(videoId) {
  try {
    const response = await api.delete(`/videos/staff/${videoId}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Lỗi khi xóa video');
  }
>>>>>>> Stashed changes
}
}

export default new VideoService();