import api from './api';

class TaskerService {
  async getTaskersWithDistance(params = {}) {
    try {
      const response = await api.post('/tasker/taskers-with-distance', {}, {
        headers: {
          Authorization: api.getStoredToken() ? `Bearer ${api.getStoredToken()}` : undefined,
        },
        params
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy tasker với khoảng cách:', error);
      throw error;
    }
  }

  async searchTaskers(searchName = '', serviceId = '') {
    try {
      const response = await api.get('/tasker', {
        params: { search: searchName, serviceId }
      });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tìm kiếm tasker:', error);
      throw error;
    }
  }

  async getTaskersByVariant(variantId) {
    try {
      const response = await api.get(`/taskers/variant/${variantId}`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy tasker theo variant:', error);
      throw error;
    }
  }
}

export default new TaskerService();