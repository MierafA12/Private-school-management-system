import { BASE, request, safeJson, saveTokens, clearTokens } from './client';

export const authApi = {
  login: async (credentials) => {
    let res;
    try {
      res = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
    } catch {
      throw new Error('Cannot reach the server. Is the backend running on port 5001?');
    }

    const body = await safeJson(res);
    if (!res.ok) {
      const err = new Error(body.message || 'Login failed.');
      err.status = res.status;
      throw err;
    }
    const data = body.data;
    if (!data?.access_token) throw new Error('Login response missing token.');
    saveTokens(data);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  refresh: async (refreshToken) => {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    const body = await safeJson(res);
    if (!res.ok) throw new Error(body.message || 'Refresh failed.');
    return body.data;
  },

  logout: async () => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (_) {}
    clearTokens();
  },

  changePassword: (current_password, new_password) =>
    request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password }),
    }),

  // Profile — works for any role
  getMe: () => request('/auth/me'),
  updateProfile: (data) =>
    request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};
