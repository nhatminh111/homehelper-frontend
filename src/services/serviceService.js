import api from './api';

class ServiceService {
  async getAll() {
    const res = await api.get('/services');
    return this._normalizeServices(res.data);
  }
  async getById(id) {
    const res = await api.get(`/services/${id}`);
    // backend may wrap in {success,data}
    return res.data?.data || res.data;
  }
  _normalizeServices(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    if (payload && payload.success && Array.isArray(payload.services)) return payload.services;
    return [];
  }
}

export default new ServiceService();
