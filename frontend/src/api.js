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

// ─── Parent API ───────────────────────────────────────────────────────────────
export const parentApi = {
  getDashboard:    ()                       => request('/parent/dashboard'),
  getChildren:     ()                       => request('/parent/children'),
  getChildProfile: (studentId)             => request(`/parent/children/${studentId}/profile`),

  getChildAttendance: (studentId, year, month) =>
    request(`/parent/children/${studentId}/attendance?year=${year}&month=${month}`),

  getChildGrades:       (studentId)         => request(`/parent/children/${studentId}/grades`),
  getChildReportCards:  (studentId)         => request(`/parent/children/${studentId}/report-cards`),
  getChildReportCardById: (studentId, id)   => request(`/parent/children/${studentId}/report-cards/${id}`),

  getFees:         ()                       => request('/parent/fees'),
  getFeeById:      (invoiceId)             => request(`/parent/fees/${invoiceId}`),
  initiatePayment: (invoiceId, amount, method) =>
    request(`/parent/fees/${invoiceId}/pay`, {
      method: 'POST',
      body:   JSON.stringify({ amount, method }),
    }),

  getAnnouncements: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/parent/announcements${qs ? `?${qs}` : ''}`);
  },
  getEvents:  (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/parent/events${qs ? `?${qs}` : ''}`);
  },
  rsvpEvent: (eventId, response) =>
    request(`/parent/events/${eventId}/rsvp`, {
      method: 'POST',
      body:   JSON.stringify({ response }),
    }),

  getMessages:       ()                    => request('/parent/messages'),
  getConversation:   (id)                  => request(`/parent/messages/${id}`),
  startConversation: (data)               =>
    request('/parent/messages', { method: 'POST', body: JSON.stringify(data) }),
  sendMessage:       (convId, body)       =>
    request(`/parent/messages/${convId}`, { method: 'POST', body: JSON.stringify({ body }) }),

  getProfile:               ()            => request('/parent/profile'),
  updateNotificationPrefs:  (prefs)       =>
    request('/parent/notification-preferences', { method: 'PATCH', body: JSON.stringify(prefs) }),
};

// ─── Accountant API ───────────────────────────────────────────────────────────
export const accountantApi = {
  getDashboard:       ()       => request('/accountant/dashboard'),

  // Fee structures
  getFeeStructures:   (p={})  => request(`/accountant/fee-structures?${new URLSearchParams(p)}`),
  createFeeStructure: (data)  => request('/accountant/fee-structures', { method:'POST', body:JSON.stringify(data) }),
  updateFeeStructure: (id, d) => request(`/accountant/fee-structures/${id}`, { method:'PATCH', body:JSON.stringify(d) }),
  archiveFeeStructure:(id)    => request(`/accountant/fee-structures/${id}`, { method:'DELETE' }),

  // Invoices
  generateInvoices:   (data)  => request('/accountant/invoices/generate', { method:'POST', body:JSON.stringify(data) }),
  getInvoices:        (p={})  => request(`/accountant/invoices?${new URLSearchParams(p)}`),
  getInvoice:         (id)    => request(`/accountant/invoices/${id}`),

  // Payments
  recordPayment:      (data)  => request('/accountant/payments', { method:'POST', body:JSON.stringify(data) }),
  getPayments:        (p={})  => request(`/accountant/payments?${new URLSearchParams(p)}`),
  getReceipt:         (id)    => request(`/accountant/payments/${id}/receipt`),

  // Reports
  getCollectionsReport: (p={}) => request(`/accountant/reports/collections?${new URLSearchParams(p)}`),
  getArrearsReport:     (p={}) => request(`/accountant/reports/arrears?${new URLSearchParams(p)}`),
  getRevenueReport:     (p={}) => request(`/accountant/reports/revenue?${new URLSearchParams(p)}`),

  // Shared lookups (reuse registrar endpoints)
  getAcademicYears: () => request('/registrar/academic-years').catch(() => []),
  getTerms:         () => request('/registrar/terms').catch(() => []),
  getClasses:       () => request('/registrar/classes').catch(() => []),
};

// ─── Principal API ────────────────────────────────────────────────────────────
export const principalApi = {
  getDashboard:        ()      => request('/principal/dashboard'),
  getAnnouncements:    (p={})  => request(`/principal/announcements?${new URLSearchParams(p)}`),
  createAnnouncement:  (data)  => request('/principal/announcements', { method: 'POST', body: JSON.stringify(data) }),
  deleteAnnouncement:  (id)    => request(`/principal/announcements/${id}`, { method: 'DELETE' }),
};

// ─── Teacher API ──────────────────────────────────────────────────────────────
export const teacherApi = {
  getDashboard:    ()                              => request('/teacher/dashboard'),
  getClasses:      ()                              => request('/teacher/classes'),
  getTimetable:    ()                              => request('/teacher/timetable'),
  getAttendance:   (classId, sectionId, date)      => request(`/teacher/attendance?classId=${classId}&sectionId=${sectionId}&date=${date}`),
  submitAttendance:(data)                          => request('/teacher/attendance', { method: 'POST', body: JSON.stringify(data) }),
  getExams:        (classId, sectionId, subjectId) => request(`/teacher/exams?classId=${classId}&sectionId=${sectionId}&subjectId=${subjectId}`),
  getExamResults:  (examScheduleId)                => request(`/teacher/exams/${examScheduleId}/results`),
  submitGrades:    (examScheduleId, results)       => request(`/teacher/exams/${examScheduleId}/results`, { method: 'POST', body: JSON.stringify({ results }) }),
  getAnnouncements:(p={})                          => request(`/teacher/announcements?${new URLSearchParams(p)}`),
};

// ─── Notification API ─────────────────────────────────────────────────────────
export const notificationApi = {
  list:               (p={}) => request(`/notifications?${new URLSearchParams(p)}`),
  getUnreadCount:     ()     => request('/notifications/unread-count'),
  markRead:           (id)   => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllRead:        ()     => request('/notifications/read-all',    { method: 'PATCH' }),
  getPreferences:     ()     => request('/notifications/preferences'),
  updatePreferences:  (data) => request('/notifications/preferences', { method: 'PATCH', body: JSON.stringify(data) }),
};
