const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

// Helper function để tạo headers với token
const createHeaders = (token = null, isFormData = false) => {
  const headers = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

// Helper function để xử lý response
export const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || data.error || "Có lỗi xảy ra"); // Hỗ trợ cả message và error từ backend
  }
  return data;
};

// Helper: build URL with query params (axios-like options.params)
const buildUrl = (url, params) => {
  if (!params || Object.keys(params).length === 0)
    return `${API_BASE_URL}${url}`;
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      usp.append(key, String(value));
    }
  });
  return `${API_BASE_URL}${url}${
    url.includes("?") ? "&" : "?"
  }${usp.toString()}`;
};

// Helper: get token from localStorage (if present)
const getStoredToken = () => {
  try {
    return localStorage.getItem("token");
  } catch (_) {
    return null;
  }
};

// Lightweight fetch-based API client with axios-like shape
const api = {
  async get(url, options = {}) {
    const fullUrl = buildUrl(url, options.params);
    const token = options.token ?? getStoredToken();
    const headers = {
      ...createHeaders(token, false),
      ...(options.headers || {}),
    };
    const res = await fetch(fullUrl, { method: "GET", headers });
    const data = await handleResponse(res);
    return { data };
  },
  async delete(url, options = {}) {
    const fullUrl = buildUrl(url, options.params);
    const token = options.token ?? getStoredToken();
    const headers = {
      ...createHeaders(token, false),
      ...(options.headers || {}),
    };
    const res = await fetch(fullUrl, { method: "DELETE", headers });
    const data = await handleResponse(res);
    return { data };
  },
  async post(url, body, options = {}) {
    const fullUrl = buildUrl(url, options.params);
    const token = options.token ?? getStoredToken();
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
    const baseHeaders = createHeaders(token, isFormData);
    const headers = { ...baseHeaders, ...(options.headers || {}) };
    // Xóa Content-Type nếu là FormData để trình duyệt tự xử lý
    if (isFormData) {
      delete headers['Content-Type'];
    }
    const res = await fetch(fullUrl, {
      method: "POST",
      headers,
      body: isFormData ? body : JSON.stringify(body ?? {}),
    });
    const data = await handleResponse(res);
    return { data };
  },
  async put(url, body, options = {}) {
    const fullUrl = buildUrl(url, options.params);
    const token = options.token ?? getStoredToken();
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const baseHeaders = createHeaders(token, isFormData);
    const headers = { ...baseHeaders, ...(options.headers || {}) };
    const res = await fetch(fullUrl, {
      method: "PUT",
      headers,
      body: isFormData ? body : JSON.stringify(body ?? {}),
    });
    const data = await handleResponse(res);
    return { data };
  },
  getStoredToken, // Thêm getStoredToken vào object api
};
export { getStoredToken };
// Auth API
export const authAPI = {
  // Đăng ký
  register: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: createHeaders(null, false),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  // Đăng nhập
  login: async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: createHeaders(null, false),
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  // Đăng nhập với Google ID token
  loginWithGoogle: async (idToken) => {
    const response = await fetch(`${API_BASE_URL}/auth/google`, {
      method: "POST",
      headers: createHeaders(),
      body: JSON.stringify({ idToken }),
    });
    return handleResponse(response);
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async (token) => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: createHeaders(token, false),
    });
    return handleResponse(response);
  },

  // Đổi password
  changePassword: async (passwordData, token) => {
    const response = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: "POST",
      headers: createHeaders(token, false),
      body: JSON.stringify(passwordData),
    });
    return handleResponse(response);
  },

  // Quên password
  forgotPassword: async (email) => {
    const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: "POST",
      headers: createHeaders(null, false),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  // Reset password
  resetPassword: async (resetData) => {
    const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: "POST",
      headers: createHeaders(null, false),
      body: JSON.stringify(resetData),
    });
    return handleResponse(response);
  },

  // Verify email
  verifyEmail: async (email, token) => {
    const url = `${API_BASE_URL}/auth/verify-email?email=${encodeURIComponent(
      email
    )}&token=${encodeURIComponent(token)}`;
    const response = await fetch(url, {
      method: "GET",
      headers: createHeaders(),
    });
    return handleResponse(response);
  },
};

// CCCD API
export const cccdAPI = {
  submit: async (payload, token) => {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (v !== undefined && v !== null) form.append(k, v);
    });
    const response = await fetch(`${API_BASE_URL}/cccd/submit`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    return handleResponse(response);
  },
  getByUser: async (userId, token) => {
    const response = await fetch(`${API_BASE_URL}/cccd/user/${userId}`, {
      method: "GET",
      headers: createHeaders(token),
    });
    return handleResponse(response);
  }
};

// Python OCR API (Direct integration)
export const pythonOCRAPI = {
  // Extract CCCD using Python OCR
  extractCCCD: async (frontImage, backImage = null) => {
    const form = new FormData();
    form.append('front_image', frontImage);
    if (backImage) {
      form.append('back_image', backImage);
    }
    const response = await fetch('http://localhost:8080/api/cccd/extract', {
      method: 'POST',
      body: form,
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Python OCR processing failed');
    }
    return data;
  },
  // Health check for Python OCR
  healthCheck: async () => {
    const response = await fetch('http://localhost:8080/api/ocr/health');
    const data = await response.json();
    if (!response.ok) {
      throw new Error('Python OCR service not available');
    }
    return data;
  }
};

// Address API (giữ nguyên, backend tự xử lý lat/lng)
export const addressAPI = {
  create: async (address, token) => {
    const response = await fetch(`${API_BASE_URL}/tasker/address`, {
      method: "POST",
      headers: createHeaders(token),
      body: JSON.stringify({ address }),
    });
    return handleResponse(response);
  },

  getAll: async (token) => {
    const response = await fetch(`${API_BASE_URL}/tasker/address`, {
      method: "GET",
      headers: createHeaders(token),
    });
    const data = await handleResponse(response);
    return data.addresses || [];
  },

  update: async (addressId, address, token) => {
    const response = await fetch(
      `${API_BASE_URL}/tasker/address/${addressId}`,
      {
        method: "PUT",
        headers: createHeaders(token),
        body: JSON.stringify({ address }),
      }
    );
    return handleResponse(response);
  },

  delete: async (addressId, token) => {
    const response = await fetch(
      `${API_BASE_URL}/tasker/address/${addressId}`,
      {
        method: "DELETE",
        headers: createHeaders(token),
      }
    );
    return handleResponse(response);
  },
  searchNearby: async (
    lat,
    lng,
    radius,
    services = [],
    minRating = 0,
    token = null
  ) => {
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    const response = await fetch(`${API_BASE_URL}/tasker/search-nearby`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius: parseInt(radius),
        services: services.map((id) => parseInt(id)),
        min_rating: parseFloat(minRating) || null,
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
      method: "GET",
      headers: createHeaders(token),
    });
    const data = await handleResponse(response);
    return data.data || [];
  },

  // Get service by ID
  getServiceById: async (serviceId, token = null) => {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: "GET",
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },
};

export const healthCheck = async () => {
  const response = await fetch(`${API_BASE_URL.replace("/api", "")}/health`);
  return handleResponse(response);
};

export default api;
