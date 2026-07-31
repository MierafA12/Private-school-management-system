// ─── Base URL ─────────────────────────────────────────────────────────────────
// In dev the Vite proxy rewrites /api → http://localhost:5000/api
// In production set VITE_API_URL=https://your-backend.com/api
const BASE = import.meta.env.VITE_API_URL || '/api';

// ─── Token helpers ────────────────────────────────────────────────────────────
export const getAccessToken  = () => localStorage.getItem('access_token');
export const getRefreshToken = () => localStorage.getItem('refresh_token');

const saveTokens = ({ access_token, refresh_token }) => {
  if (access_token)  localStorage.setItem('access_token',  access_token);
  if (refresh_token) localStorage.setItem('refresh_token', refresh_token);
};

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
};

// ─── Safe JSON parser ─────────────────────────────────────────────────────────
// Never throws — returns {} if the body is empty or not valid JSON.
const safeJson = async (res) => {
  const text = await res.text();
  if (!text || !text.trim()) return {};
  try { return JSON.parse(text); }
  catch {
    // If the backend returned HTML (proxy miss / 404 page) give a clear message
    const preview = text.slice(0, 120);
    const isHtml  = preview.trimStart().startsWith('<');
    throw Object.assign(
      new Error(isHtml
        ? `Backend not reachable. Check that the server is running on port 5000.`
        : `Invalid JSON from server: ${preview}`),
      { status: res.status }
    );
  }
};

// ─── Core fetch wrapper ───────────────────────────────────────────────────────
let isRefreshing = false;
let refreshQueue = [];

const processQueue = (error, token = null) => {
  refreshQueue.forEach(({ resolve, reject }) =>
    error ? reject(error) : resolve(token)
  );
  refreshQueue = [];
};

async function request(path, options = {}, retry = true) {
  const token = getAccessToken();

  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
  } catch (networkErr) {
    throw Object.assign(
      new Error('Cannot reach the server. Is the backend running on port 5000?'),
      { status: 0 }
    );
  }

  // ── Auto-refresh on 401 ───────────────────────────────────────────────────
  if (res.status === 401 && retry) {
    const refreshTok = getRefreshToken();
    if (!refreshTok) {
      clearTokens();
      throw Object.assign(new Error('Session expired. Please log in again.'), { status: 401 });
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) =>
        request(path, {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${newToken}` },
        }, false)
      );
    }

    isRefreshing = true;
    try {
      const data = await authApi.refresh(refreshTok);
      saveTokens({ access_token: data.access_token });
      processQueue(null, data.access_token);
      return request(path, options, false);
    } catch (err) {
      processQueue(err);
      clearTokens();
      throw Object.assign(new Error('Session expired. Please log in again.'), { status: 401 });
    } finally {
      isRefreshing = false;
    }
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  const body = await safeJson(res);

  if (!res.ok) {
    const err = new Error(body.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.data   = body;
    throw err;
  }

  return body.data ?? body;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (credentials) => {
    let res;
    try {
      res = await fetch(`${BASE}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(credentials),
      });
    } catch {
      throw new Error('Cannot reach the server. Is the backend running on port 5000?');
    }

    const body = await safeJson(res);

    if (!res.ok) {
      const err = new Error(body.message || 'Login failed.');
      err.status = res.status;
      throw err;
    }

    const data = body.data;
    if (!data?.access_token) {
      throw new Error('Login response missing token. Check backend logs.');
    }

    saveTokens(data);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  refresh: async (refreshToken) => {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refresh_token: refreshToken }),
    });
    const body = await safeJson(res);
    if (!res.ok) throw new Error(body.message || 'Refresh failed.');
    return body.data;
  },

  logout: async () => {
    try { await request('/auth/logout', { method: 'POST' }); } catch (_) {}
    clearTokens();
  },

  changePassword: (current_password, new_password) =>
    request('/auth/change-password', {
      method: 'POST',
      body:   JSON.stringify({ current_password, new_password }),
    }),
};

// ─── Registrar API ────────────────────────────────────────────────────────────
export const registrarApi = {
  registerStudent: (data) => request('/registrar/students', { method: 'POST', body: JSON.stringify(data) }),
  registerParent:  (data) => request('/registrar/parents',  { method: 'POST', body: JSON.stringify(data) }),
  registerTeacher: (data) => request('/registrar/teachers', { method: 'POST', body: JSON.stringify(data) }),
  registerStaff:   (data) => request('/registrar/staff',    { method: 'POST', body: JSON.stringify(data) }),

  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/registrar/users${qs ? `?${qs}` : ''}`);
  },
  getUserById:    (id)               => request(`/registrar/users/${id}`),
  resetPassword:  (id, new_password) => request(`/registrar/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) }),
  setUserStatus:  (id, status)       => request(`/registrar/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ─── Student API ──────────────────────────────────────────────────────────────
export const studentApi = {
  getDashboard:        ()            => request('/student/dashboard'),
  getProfile:          ()            => request('/student/profile'),
  updateProfile:       (fields)      => request('/student/profile', { method: 'PATCH', body: JSON.stringify(fields) }),

  getAttendance:       (year, month) => request(`/student/attendance?year=${year}&month=${month}`),

  getTimetable:        ()            => request('/student/timetable'),
  getSubjects:         ()            => request('/student/subjects'),
  getEnrollmentHistory:()            => request('/student/enrollment-history'),

  getExams:            ()            => request('/student/exams'),

  getReportCards:      ()            => request('/student/report-cards'),
  getReportCardById:   (id)          => request(`/student/report-cards/${id}`),

  getFees:             ()            => request('/student/fees'),
  getFeeInvoiceById:   (id)          => request(`/student/fees/${id}`),

  getAnnouncements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/student/announcements${qs ? `?${qs}` : ''}`);
  },
  getAnnouncementById: (id)          => request(`/student/announcements/${id}`),
};
