import api from './api';

const userService = {
  async searchUsers(query, limit = 10) {
    const response = await api.get('/users/search', {
      params: { q: query, limit }
    });
    return response.data.users || [];
  }
};

export default userService;


