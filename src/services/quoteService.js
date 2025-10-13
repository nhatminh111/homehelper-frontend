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

  // Tasker gửi báo giá cho 1 post
  async createQuote({ post_id, variant_id, proposed_price, proposal }) {
    try {
      const response = await api.post(`/quotes`, { post_id, variant_id, proposed_price, proposal });
      return response.data;
    } catch (error) {
      console.error('Lỗi khi tạo báo giá:', error);
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Không thể tạo báo giá.');
    }
  }

  // Tasker: lấy báo giá của chính mình cho 1 post (nếu đã gửi)
  async getMyQuoteForPost(postId) {
    try {
      const response = await api.get(`/quotes/posts/${postId}/me`);
      return response.data;
    } catch (error) {
      console.error('Lỗi khi lấy báo giá của bạn trên post:', error);
      throw new Error(error.response?.data?.message || error.response?.data?.error || 'Không thể tải báo giá của bạn.');
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