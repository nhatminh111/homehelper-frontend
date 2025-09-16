const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper function để tạo headers với token
export const createHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function để xử lý response
export const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Có lỗi xảy ra'); // Hỗ trợ cả message và error từ backend
  }
  
  return data;
};

// Auth API (giữ nguyên)
export const authAPI = {
  // Đăng ký
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Đăng nhập
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },

  // Đổi password
  changePassword: async (passwordData, token) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify(passwordData),
    });
    return handleResponse(response);
  },

  // Quên password
  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(resetData),
    });
    return handleResponse(response);
  },
};

// Address API (giữ nguyên, backend tự xử lý lat/lng)
export const addressAPI = {
  create: async (address, token) => {
    const response = await fetch(`${API_BASE_URL}/tasker/address`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify({ address }),
    });
    return handleResponse(response);
  },

  getAll: async (token) => {
    const response = await fetch(`${API_BASE_URL}/tasker/address`, {
      method: 'GET',
      headers: createHeaders(token),
    });
    const data = await handleResponse(response);
    return data.addresses || [];
  },

  update: async (addressId, address, token) => {
    const response = await fetch(`${API_BASE_URL}/tasker/address/${addressId}`, {
      method: 'PUT',
      headers: createHeaders(token),
      body: JSON.stringify({ address }),
    });
    return handleResponse(response);
  },

  delete: async (addressId, token) => {
    const response = await fetch(`${API_BASE_URL}/tasker/address/${addressId}`, {
      method: 'DELETE',
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },
  searchNearby: async (lat, lng, radius, services = [], minRating = 0, token = null) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };

    const response = await fetch(`${API_BASE_URL}/tasker/search-nearby`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ 
        lat: parseFloat(lat), 
        lng: parseFloat(lng), 
        radius: parseInt(radius), 
        services: services.map(id => parseInt(id)), 
        min_rating: parseFloat(minRating) || null 
      }),
    });
    return handleResponse(response); 
  },
};

// Health check
// Services API
export const servicesAPI = {
  // Get all services
  getAllServices: async (token = null) => {
    const response = await fetch(`${API_BASE_URL}/services`, {
      method: 'GET',
      headers: createHeaders(token),
    });
    const data = await handleResponse(response);
    return data.data || [];
  },

  // Get service by ID
  getServiceById: async (serviceId, token = null) => {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: 'GET',
      headers: createHeaders(token),
    });
    return handleResponse(response);
  }
};

export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
  return handleResponse(response);
};