import api from './api';

class QuoteService {
  // Lấy danh sách quotes của bài viết
  async getPostQuotes(postId) {
    try {
      const response = await api.get(`/quotes/${postId}/quotes`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy danh sách báo giá:', error);
      throw new Error(error.response?.data?.error || 'Không thể tải danh sách báo giá.');
    }
  }


  // Từ chối quote
  async rejectQuote(quoteId) {
    try {
      const response = await api.post(`/quotes/${quoteId}/reject`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi từ chối báo giá:', error);
      throw new Error(error.response?.data?.error || 'Không thể từ chối báo giá.');
    }
  }
}

export default new QuoteService();