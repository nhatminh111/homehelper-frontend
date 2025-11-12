const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

const withAuth = (token, opts = {}) => ({
  ...opts,
  headers: {
    'Content-Type': 'application/json',
    ...(opts.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  },
});

export const adminUsersAPI = {
  async list({ token, page = 1, pageSize = 20, search = '', role, order, dir } = {}) {
    const qs = new URLSearchParams({ page, pageSize, search });
    if (role) qs.append('role', role);
    if (order) qs.append('order', order);
    if (dir) qs.append('dir', dir);
    const res = await fetch(`${API_BASE_URL}/admin/users?${qs.toString()}`, withAuth(token));
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to load users');
    return json;
  },
  async get({ token, id }) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, withAuth(token));
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to load user');
    return json;
  },
  async update({ token, id, payload }) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, withAuth(token, { method: 'PUT', body: JSON.stringify(payload) }));
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to update user');
    return json;
  },
  async ban({ token, id }) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/ban`, withAuth(token, { method: 'POST' }));
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to ban user');
    return json;
  },
  async unban({ token, id }) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}/unban`, withAuth(token, { method: 'POST' }));
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to unban user');
    return json;
  },
  async remove({ token, id }) {
    const res = await fetch(`${API_BASE_URL}/admin/users/${id}`, withAuth(token, { method: 'DELETE' }));
    const json = await res.json();
    if (!res.ok || json.success === false) throw new Error(json.message || 'Failed to delete user');
    return json;
  },
};

export default adminUsersAPI;