const API_BASE_URL = 'http://localhost:3001/api';

// Helper function để tạo headers với token
const createHeaders = (token = null, isFormData = false) => {
  const headers = {};
  
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
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

// Helper: build URL with query params (axios-like options.params)
const buildUrl = (url, params) => {
  if (!params || Object.keys(params).length === 0) return `${API_BASE_URL}${url}`;
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      usp.append(key, String(value));
    }
  });
  return `${API_BASE_URL}${url}${url.includes('?') ? '&' : '?'}${usp.toString()}`;
};

// Helper: get token from localStorage (if present)
const getStoredToken = () => {
  try {
    return localStorage.getItem('token');
  } catch (_) {
    return null;
  }
};

// Lightweight fetch-based API client with axios-like shape
const api = {
  async get(url, options = {}) {
    const fullUrl = buildUrl(url, options.params);
    const token = options.token ?? getStoredToken();
    const headers = { ...createHeaders(token, false), ...(options.headers || {}) };
    const res = await fetch(fullUrl, { method: 'GET', headers });
    const data = await handleResponse(res);
    return { data };
  },
  async delete(url, options = {}) {
    const fullUrl = buildUrl(url, options.params);
    const token = options.token ?? getStoredToken();
    const headers = { ...createHeaders(token, false), ...(options.headers || {}) };
    const res = await fetch(fullUrl, { method: 'DELETE', headers });
    const data = await handleResponse(res);
    return { data };
  },
  async post(url, body, options = {}) {
    const fullUrl = buildUrl(url, options.params);
    const token = options.token ?? getStoredToken();
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const baseHeaders = createHeaders(token, isFormData);
    const headers = { ...baseHeaders, ...(options.headers || {}) };
    const res = await fetch(fullUrl, {
      method: 'POST',
      headers,
      body: isFormData ? body : JSON.stringify(body ?? {}),
    });
    const data = await handleResponse(res);
    return { data };
  },
  async put(url, body, options = {}) {
    const fullUrl = buildUrl(url, options.params);
    const token = options.token ?? getStoredToken();
    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    const baseHeaders = createHeaders(token, isFormData);
    const headers = { ...baseHeaders, ...(options.headers || {}) };
    const res = await fetch(fullUrl, {
      method: 'PUT',
      headers,
      body: isFormData ? body : JSON.stringify(body ?? {}),
    });
    const data = await handleResponse(res);
    return { data };
  },
};

// Auth API
export const authAPI = {
  // Đăng ký
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: createHeaders(null, false),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Đăng nhập
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: createHeaders(null, false),
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  // Đăng nhập với Google ID token
  loginWithGoogle: async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ idToken }),
    });
    return handleResponse(response);
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: createHeaders(token, false),
    });
    return handleResponse(response);
  },

  // Đổi password
  changePassword: async (passwordData, token) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: createHeaders(token, false),
      body: JSON.stringify(passwordData),
    });
    return handleResponse(response);
  },

  // Quên password
  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: createHeaders(null, false),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: createHeaders(null, false),
      body: JSON.stringify(resetData),
    });
    return handleResponse(response);
  },

  // Verify email
  verifyEmail: async (email, token) => {
    const url = `${API_BASE_URL}/auth/verify-email?email=${encodeURIComponent(email)}&token=${encodeURIComponent(token)}`;
    const response = await fetch(url, { method: 'GET', headers: createHeaders() });
    return handleResponse(response);
  }
};

// Health check
export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
  return handleResponse(response);
};

export default api;
