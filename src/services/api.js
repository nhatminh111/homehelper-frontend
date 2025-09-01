const API_BASE_URL = 'http://localhost:3001/api';

// Helper function để tạo headers với token
const createHeaders = (token = null) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Helper function để xử lý response
const handleResponse = async (response) => {
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Có lỗi xảy ra');
  }
  
  return data;
};

// Auth API
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

// Health check
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
  return handleResponse(response);
};


