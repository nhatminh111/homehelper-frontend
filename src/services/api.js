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
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;
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
};

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
    console.log('🚀 CCCD API submit - payload:', payload);
    
    const form = new FormData();
    
    // Thêm các trường text
    if (payload.number) form.append('number', payload.number);
    if (payload.full_name) form.append('full_name', payload.full_name);
    if (payload.dob) form.append('dob', payload.dob);
    if (payload.gender) form.append('gender', payload.gender);
    if (payload.ocr_payload) form.append('ocr_payload', payload.ocr_payload);
    if (payload.face_cloud_url) form.append('face_cloud_url', payload.face_cloud_url);
    
    // Thêm các file
    if (payload.front) {
      console.log('📸 Adding front file:', payload.front.name);
      form.append('front', payload.front);
    }
    if (payload.back) {
      console.log('📸 Adding back file:', payload.back.name);
      form.append('back', payload.back);
    }
    
    console.log('📋 FormData entries:');
    for (let [key, value] of form.entries()) {
      console.log(`  ${key}:`, value instanceof File ? `${value.name} (${value.size} bytes)` : value);
    }
    
    const url = `${API_BASE_URL}/cccd/submit`;
    console.log('🌐 Request URL:', url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.clone().text();
    console.log('📡 Response body:', responseText);
    
    return handleResponse(response);
  },
  
  getUserCccd: async (token) => {
    const response = await fetch(`${API_BASE_URL}/cccd/user`, {
      method: "GET",
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },
  
  getLatestCccd: async (token) => {
    const response = await fetch(`${API_BASE_URL}/cccd/latest`, {
      method: "GET",
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },

  // Upload ảnh mặt lên Cloudinary
  uploadFaceImage: async (faceImageUrl, token) => {
    const response = await fetch(`${API_BASE_URL}/cccd/upload-face`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify({ faceImageUrl })
    });
    return handleResponse(response);
  }
};

// Convenience helpers for CCCD status/verified
export const getCCCDStatus = async (token = null) => {
  const response = await fetch(`${API_BASE_URL}/cccd/status`, {
    method: 'GET',
    headers: createHeaders(token)
  });
  return handleResponse(response);
};

export const checkVerifiedCCCD = async (token = null) => {
  const response = await fetch(`${API_BASE_URL}/cccd/verified`, {
    method: 'GET',
    headers: createHeaders(token)
  });
  return handleResponse(response);
};

// Python OCR API (Direct integration)
export const pythonOCRAPI = {
  // Extract CCCD using Python OCR
  extractCCCD: async (frontImage, backImage = null) => {
    // Sử dụng API gốc như web interface: upload rồi extract
    const form = new FormData();
    form.append('file', frontImage);
    
    // Bước 1: Upload ảnh
    const uploadResponse = await fetch('http://localhost:8080/uploader', {
      method: 'POST',
      body: form,
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }
    
    // Bước 2: Extract thông tin
    const extractResponse = await fetch('http://localhost:8080/extract', {
      method: 'POST',
    });
    
    const data = await extractResponse.json();
    if (!extractResponse.ok) {
      throw new Error(data.message || 'Python OCR processing failed');
    }
    
    // Convert format để phù hợp với frontend
    const fields = data.data || [];
    const extracted_data = {
      number: fields[0] || "",
      full_name: fields[1] || "",
      dob: fields[2] || "",
      gender: fields[3] || "",
      nationality: fields[4] || "",
      place_of_origin: fields[5] || "",
      place_of_residence: fields[6] || "",
      expiry_date: fields[7] || ""
    };
    
    // Lấy ảnh từ thư mục results (giống web interface gốc)
    const faceImageUrl = 'http://localhost:8080/static/results/0.jpg';
    
    return {
      success: true,
      data: extracted_data,
      face_image: faceImageUrl,
      raw_ocr_text: fields.join(" | "),
      source: "python_ocr_original"
    };
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
