import api from './api';

class BlogService {
  // Lấy danh sách posts
  async getPosts(params = {}) {
    try {
      const response = await api.get('/blogs', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  // Lấy post theo ID
  async getPostById(id) {
    try {
      const response = await api.get(`/blogs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  }

  // Tạo post mới
  async createPost(postData) {
    try {
      const response = await api.post('/blogs', postData);
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  // Cập nhật post
  async updatePost(id, updateData) {
    try {
      const response = await api.put(`/blogs/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  }

  // Xóa post
  async deletePost(id) {
    try {
      const response = await api.delete(`/blogs/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }

  // Lấy posts gần đây
  async getRecentPosts(limit = 5) {
    try {
      const response = await api.get('/blogs/recent', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching recent posts:', error);
      throw error;
    }
  }

  // Lấy posts phổ biến
  async getPopularPosts(limit = 5) {
    try {
      const response = await api.get('/blogs/popular', { params: { limit } });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular posts:', error);
      throw error;
    }
  }

  // Tìm kiếm posts
  async searchPosts(query, params = {}) {
    try {
      const response = await api.get('/blogs/search', { 
        params: { q: query, ...params } 
      });
      return response.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  }

  // Like/Unlike post
  async toggleLikePost(id, userId) {
    try {
      const response = await api.post(`/blogs/${id}/like`, { user_id: userId });
      return response.data;
    } catch (error) {
      console.error('Error toggling like:', error);
      throw error;
    }
  }

  // Lấy comments của post
  async getPostComments(postId, params = {}) {
    try {
      const response = await api.get(`/blogs/${postId}/comments`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // Tạo comment
  async createComment(commentData) {
    try {
      const response = await api.post('/blogs/comments', commentData);
      return response.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }

  // Cập nhật comment
  async updateComment(id, updateData) {
    try {
      const response = await api.put(`/blogs/comments/${id}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  // Xóa comment
  async deleteComment(id) {
    try {
      const response = await api.delete(`/blogs/comments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  }

  // Lấy services của post
  async getPostServices(postId) {
    try {
      const response = await api.get(`/blogs/${postId}/services`);
      return response.data;
    } catch (error) {
      console.error('Error fetching post services:', error);
      throw error;
    }
  }

  // Lấy thống kê
  async getStats() {
    try {
      const response = await api.get('/blogs/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  }

  // Upload hình ảnh cho post
  async uploadPostImages(files) {
    try {
      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append(`images`, file);
      });

      const response = await api.post('/uploads/post-images', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading images:', error);
      throw error;
    }
  }

  // Lấy posts của user
  async getUserPosts(userId, params = {}) {
    try {
      const response = await api.get('/blogs', { 
        params: { user_id: userId, ...params } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  }

  // Lấy posts theo service
  async getPostsByService(serviceId, params = {}) {
    try {
      const response = await api.get('/blogs', { 
        params: { service_id: serviceId, ...params } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts by service:', error);
      throw error;
    }
  }

  // Lấy bookings của user hiện tại (để chọn liên kết post)
  async getMyBookings(params = {}) {
    try {
      const response = await api.get('/bookings/my', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching my bookings:', error);
      throw error;
    }
  }

  // Lấy danh sách services (kèm variants) để chọn không cần nhớ ID
  async getAllServices() {
    try {
      const response = await api.get('/services');
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  // Lấy posts đã like của user
  async getUserLikedPosts(userId, params = {}) {
    try {
      const response = await api.get(`/users/${userId}/liked-posts`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user liked posts:', error);
      throw error;
    }
  }

  // Lấy comments của user
  async getUserComments(userId, params = {}) {
    try {
      const response = await api.get(`/users/${userId}/comments`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching user comments:', error);
      throw error;
    }
  }

  // Kiểm tra user đã like post chưa
  async isPostLikedByUser(postId, userId) {
    try {
      const response = await api.get(`/blogs/${postId}/likes`, { 
        params: { user_id: userId } 
      });
      return response.data.isLiked || false;
    } catch (error) {
      console.error('Error checking like status:', error);
      return false;
    }
  }
}

export default new BlogService();
