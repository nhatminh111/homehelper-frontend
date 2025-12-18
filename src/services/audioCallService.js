/**
 * 📞 Audio Call Service
 * Xử lý tất cả API calls liên quan đến audio call
 * Giống cách dùng các service khác (quoteService, etc.)
 */

import api from './api';

class AudioCallService {
  /**
   * Bắt đầu cuộc gọi
   * @param {number} conversationId
   * @returns {Promise<{callId, status, caller, callee, conversation}>}
   */
  static async initiateCall(conversationId) {
    try {
      console.log('📞 Calling API with conversationId:', conversationId);
      const response = await api.post('/audio-calls/initiate', { conversationId });
      console.log('📞 initiateCall response:', response.data);
      // Backend returns {message, data: {call, callee}}, we need to return just {call, callee}
      return response.data.data;
    } catch (error) {
      console.error('❌ Error initiating call:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      throw new Error(error.response?.data?.error || error.message || 'Failed to initiate call');
    }
  }

  /**
   * Chấp nhận cuộc gọi
   * @param {string} callId
   * @returns {Promise<{callId, status, started_at}>}
   */
  static async acceptCall(callId) {
    try {
      const response = await api.post(`/audio-calls/${callId}/accept`, {});
      return response.data.data;
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      throw new Error(error.message || 'Failed to accept call');
    }
  }

  /**
   * Từ chối cuộc gọi
   * @param {string} callId
   * @param {string} reason
   * @returns {Promise<{callId, status}>}
   */
  static async rejectCall(callId, reason = 'Busy') {
    try {
      const response = await api.post(`/audio-calls/${callId}/reject`, { reason });
      return response.data.data;
    } catch (error) {
      console.error('❌ Error rejecting call:', error);
      throw new Error(error.message || 'Failed to reject call');
    }
  }

  /**
   * Kết thúc cuộc gọi
   * @param {string} callId
   * @param {number} duration - giây
   * @param {string} quality - low, medium, high
   * @returns {Promise<{callId, status, duration}>}
   */
  static async endCall(callId, duration, quality = 'medium') {
    try {
      const response = await api.post(`/audio-calls/${callId}/end`, { duration, quality });
      return response.data.data;
    } catch (error) {
      console.error('❌ Error ending call:', error);
      throw new Error(error.message || 'Failed to end call');
    }
  }

  /**
   * Lấy lịch sử cuộc gọi của user
   * @param {number} limit
   * @param {number} offset
   * @returns {Promise<{calls, pagination}>}
   */
  static async getCallHistory(limit = 50, offset = 0) {
    try {
      const response = await api.get('/audio-calls/history', {
        params: { limit, offset }
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching call history:', error);
      throw new Error(error.message || 'Failed to fetch call history');
    }
  }

  /**
   * Lấy cuộc gọi trong conversation
   * @param {number} conversationId
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  static async getConversationCalls(conversationId, limit = 50) {
    try {
      const response = await api.get(`/audio-calls/conversation/${conversationId}`, {
        params: { limit }
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching conversation calls:', error);
      throw new Error(error.message || 'Failed to fetch conversation calls');
    }
  }

  /**
   * Lấy audio call messages từ conversation
   * @param {number} conversationId
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  static async getAudioCallMessages(conversationId, limit = 50) {
    try {
      const response = await api.get(`/audio-calls/conversation/${conversationId}/messages`, {
        params: { limit }
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching audio call messages:', error);
      throw new Error(error.message || 'Failed to fetch audio call messages');
    }
  }

  /**
   * Lấy cuộc gọi hiện tại đang active
   * @returns {Promise<{callId, status, caller_id, callee_id}>}
   */
  static async getActiveCall() {
    try {
      const response = await api.get('/audio-calls/active');
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching active call:', error);
      throw new Error(error.message || 'Failed to fetch active call');
    }
  }

  /**
   * Lấy các cuộc gọi bỏ lỡ
   * @param {number} limit
   * @returns {Promise<Array>}
   */
  static async getMissedCalls(limit = 50) {
    try {
      const response = await api.get('/audio-calls/missed', {
        params: { limit }
      });
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching missed calls:', error);
      throw new Error(error.message || 'Failed to fetch missed calls');
    }
  }

  /**
   * Lấy thống kê cuộc gọi
   * @returns {Promise<{totalCalls, outgoing, incoming, missed, duration, etc}>}
   */
  static async getCallStats() {
    try {
      const response = await api.get('/audio-calls/stats');
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching call stats:', error);
      throw new Error(error.message || 'Failed to fetch call stats');
    }
  }

  /**
   * Lấy chi tiết cuộc gọi
   * @param {string} callId
   * @returns {Promise<{callId, caller, callee, status, duration, etc}>}
   */
  static async getCallDetail(callId) {
    try {
      const response = await api.get(`/audio-calls/${callId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error fetching call details:', error);
      throw new Error(error.message || 'Failed to fetch call details');
    }
  }

  /**
   * Xóa một cuộc gọi
   * @param {string} callId
   * @returns {Promise<{message}>}
   */
  static async deleteCall(callId) {
    try {
      const response = await api.delete(`/audio-calls/${callId}`);
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error deleting call:', error);
      throw new Error(error.message || 'Failed to delete call');
    }
  }

  /**
   * Xóa tất cả cuộc gọi
   * @returns {Promise<{message}>}
   */
  static async deleteAllCalls() {
    try {
      const response = await api.delete('/audio-calls/all');
      return response.data.data || response.data;
    } catch (error) {
      console.error('❌ Error deleting all calls:', error);
      throw new Error(error.message || 'Failed to delete all calls');
    }
  }
}

export default AudioCallService;
