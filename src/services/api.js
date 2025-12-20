const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:3001/api";

const PYTHON_OCR_URL =
  process.env.REACT_APP_PYTHON_OCR_URL || "http://localhost:8080";

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
  let data;
  try {
    const text = await response.text();
    data = text ? JSON.parse(text) : {};
  } catch (e) {
    data = { message: "Phản hồi không phải JSON hợp lệ" };
  }

  if (!response.ok) {
    const error = new Error(data.message || data.error || "Có lỗi xảy ra");
    error.status = response.status;
    error.data = data;
    throw error;
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
  return `${API_BASE_URL}${url}${url.includes("?") ? "&" : "?"
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
  async patch(url, body, options = {}) {
    const fullUrl = buildUrl(url, options.params);
    const token = options.token ?? getStoredToken();
    const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
    const baseHeaders = createHeaders(token, isFormData);
    const headers = { ...baseHeaders, ...(options.headers || {}) };
    const res = await fetch(fullUrl, {
      method: "PATCH",
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
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await res.json();
    console.log("📤 [authAPI.login] Raw response data:", data);

    if (!res.ok) throw new Error(data.error || "Login failed");

    // ✅ Trả nguyên toàn bộ data (gồm cả user và token)
    return data;
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

  // Update profile
  uploadAvatar: async (file, token) => {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await fetch(`${API_BASE_URL}/uploads/avatar`, {
      method: "POST",
      headers: createHeaders(token, true), // true = FormData
      body: formData,
    });
    return handleResponse(response);
  },

  updateProfile: async (profileData, token) => {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "PUT",
      headers: createHeaders(token, false),
      body: JSON.stringify(profileData),
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
    if (payload.face_public_id) form.append('face_public_id', payload.face_public_id);

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

  // Get short-lived signed URL for verified CCCD front image
  getSignedUrl: async (token) => {
    const response = await fetch(`${API_BASE_URL}/cccd/signed-url`, {
      method: "GET",
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },

  // Get short-lived signed URL for verified face image
  getFaceSignedUrl: async (token) => {
    const response = await fetch(`${API_BASE_URL}/cccd/face-signed-url`, {
      method: "GET",
      headers: createHeaders(token),
    });
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
    const uploadResponse = await fetch(`${PYTHON_OCR_URL}/uploader`, {
      method: 'POST',
      body: form,
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }

    // Bước 2: Extract thông tin
    const extractResponse = await fetch(`${PYTHON_OCR_URL}/extract`, {
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
    const faceImageUrl = `${PYTHON_OCR_URL}/static/results/0.jpg`;

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
    const response = await fetch(`${PYTHON_OCR_URL}/api/ocr/health`);
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

  getServiceById: async (serviceId, token = null) => {
    const response = await fetch(`${API_BASE_URL}/services/${serviceId}`, {
      method: "GET",
      headers: createHeaders(token),
    });
    return handleResponse(response);
  },

  // Get service by ID
  getServicesByTaskerId: async (taskerId, token = null) => {
    const response = await fetch(`${API_BASE_URL}/taskers/${taskerId}/services`, {
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

export const taskerApplicationsAPI = {
  list: async (status = 'Pending', token = null) => {
    const qs = new URLSearchParams();
    if (status) qs.append('status', status);
    const res = await fetch(`${API_BASE_URL}/tasker/applications?${qs.toString()}`.replace(/\?$/, ''), {
      method: 'GET',
      headers: createHeaders(token)
    });
    return handleResponse(res); // expecting { data: [...] }
  },
  detail: async (id, token = null) => {
    const res = await fetch(`${API_BASE_URL}/tasker/applications/${id}`, {
      method: 'GET',
      headers: createHeaders(token)
    });
    return handleResponse(res); // expecting { data: {...} }
  },
  approve: async (id, token = null) => {
    const res = await fetch(`${API_BASE_URL}/tasker/applications/${id}/approve`, {
      method: 'POST',
      headers: createHeaders(token)
    });
    return handleResponse(res);
  },
  reject: async (id, note = '', token = null) => {
    const res = await fetch(`${API_BASE_URL}/tasker/applications/${id}/reject`, {
      method: 'POST',
      headers: createHeaders(token),
      body: JSON.stringify({ note })
    });
    return handleResponse(res);
  },
  recheck: async (id, token = null) => {
    const res = await fetch(`${API_BASE_URL}/tasker/applications/${id}/recheck-certifications`, {
      method: 'POST',
      headers: createHeaders(token)
    });
    return handleResponse(res);
  }
};

// Badges API (Staff/Admin restricted for create)
export const badgesAPI = {
  list: async (token = null) => {
    const res = await fetch(`${API_BASE_URL}/badges`, {
      method: 'GET',
      headers: createHeaders(token)
    });
    return handleResponse(res);
  },
  create: async (badge, token = null) => {
    const isFormData = badge instanceof FormData;
    const headers = createHeaders(token, isFormData);
    if (isFormData) delete headers['Content-Type'];
    const res = await fetch(`${API_BASE_URL}/badges`, {
      method: 'POST',
      headers,
      body: isFormData ? badge : JSON.stringify(badge)
    });
    return handleResponse(res);
  },
  update: async (id, payload, token = null) => {
    const isFormData = payload instanceof FormData;
    const headers = createHeaders(token, isFormData);
    if (isFormData) delete headers['Content-Type'];
    const res = await fetch(`${API_BASE_URL}/badges/${id}`, {
      method: 'PUT',
      headers,
      body: isFormData ? payload : JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  remove: async (id, token = null) => {
    const res = await fetch(`${API_BASE_URL}/badges/${id}`, {
      method: 'DELETE',
      headers: createHeaders(token)
    });
    return handleResponse(res);
  },
  scan: async (token = null) => {
    const res = await fetch(`${API_BASE_URL}/badges/scan`, {
      method: 'POST',
      headers: createHeaders(token)
    });
    return handleResponse(res); // { message, result: { granted, checked, ... } }
  }
};

// Admin Taskers API
export const adminTaskersAPI = {
  summary: async (token = null) => {
    const res = await fetch(`${API_BASE_URL}/admin/taskers/summary`, {
      method: 'GET',
      headers: createHeaders(token)
    });
    return handleResponse(res); // { data: [...] }
  }
};
