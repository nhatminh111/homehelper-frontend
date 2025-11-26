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
  
  // CRUD operations for Staff/Admin
  async create(serviceData) {
    const res = await api.post('/services', serviceData);
    return res.data?.data || res.data;
  }
  
  async update(id, serviceData) {
    const res = await api.put(`/services/${id}`, serviceData);
    return res.data?.data || res.data;
  }
  
  async delete(id) {
    const res = await api.delete(`/services/${id}`);
    return res.data;
  }
  
  // ===== Variants =====
  async listVariants(serviceId) {
    const res = await api.get(`/services/${serviceId}/variants`);
    return res.data?.data || res.data || [];
  }
  async getVariant(variantId) {
    const res = await api.get(`/services/variants/${variantId}`);
    return res.data?.data || res.data;
  }
  async createVariant(serviceId, data) {
    const res = await api.post(`/services/${serviceId}/variants`, data);
    return res.data?.data || res.data;
  }
  async updateVariant(variantId, data) {
    const res = await api.put(`/services/variants/${variantId}`, data);
    return res.data?.data || res.data;
  }
  async deleteVariant(variantId) {
    const res = await api.delete(`/services/variants/${variantId}`);
    return res.data;
  }
  
  _normalizeServices(payload) {
    if (Array.isArray(payload)) return payload;
    if (payload && Array.isArray(payload.data)) return payload.data;
    if (payload && payload.success && Array.isArray(payload.services)) return payload.services;
    return [];
  }
}

export default new ServiceService();
