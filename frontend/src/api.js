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
const safeJson = async (res) => {
  const text = await res.text();
  if (!text || !text.trim()) return {};
  try { return JSON.parse(text); }
  catch {
    const preview = text.slice(0, 120);
    const isHtml  = preview.trimStart().startsWith('<');
    throw Object.assign(
      new Error(isHtml
        ? 'Backend not reachable. Check that the server is running on port 5001.'
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
  } catch {
    throw Object.assign(
      new Error('Cannot reach the server. Is the backend running on port 5001?'),
      { status: 0 }
    );
  }

  if (res.status === 401 && retry) {
    const refreshTok = getRefreshToken();
    if (!refreshTok) { clearTokens(); throw Object.assign(new Error('Session expired.'), { status: 401 }); }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((newToken) =>
        request(path, { ...options, headers: { ...options.headers, Authorization: `Bearer ${newToken}` } }, false)
      );
    }
    isRefreshing = true;
    try {
      const data = await authApi.refresh(refreshTok);
      saveTokens({ access_token: data.access_token });
      processQueue(null, data.access_token);
      return request(path, options, false);
    } catch (err) {
      processQueue(err); clearTokens();
      throw Object.assign(new Error('Session expired. Please log in again.'), { status: 401 });
    } finally { isRefreshing = false; }
  }

  const body = await safeJson(res);
  if (!res.ok) {
    const err = new Error(body.message || `Request failed (${res.status})`);
    err.status = res.status; err.data = body; throw err;
  }
  return body.data ?? body;
}

// ─── Auth API ─────────────────────────────────────────────────────────────────
export const authApi = {
  login: async (credentials) => {
    let res;
    try {
      res = await fetch(`${BASE}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
    } catch { throw new Error('Cannot reach the server. Is the backend running on port 5001?'); }

    const body = await safeJson(res);
    if (!res.ok) { const err = new Error(body.message || 'Login failed.'); err.status = res.status; throw err; }
    const data = body.data;
    if (!data?.access_token) throw new Error('Login response missing token.');
    saveTokens(data);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  refresh: async (refreshToken) => {
    const res  = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
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
    request('/auth/change-password', { method: 'POST', body: JSON.stringify({ current_password, new_password }) }),

  // Profile — works for any role
  getMe:          ()       => request('/auth/me'),
  updateProfile:  (data)   => request('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─── Principal API ────────────────────────────────────────────────────────────
export const principalApi = {
  getDashboard: () => request('/principal/dashboard'),

  // Academic years
  getAcademicYears:    ()         => request('/principal/academic-years'),
  getAcademicYearById: (id)       => request(`/principal/academic-years/${id}`),
  createAcademicYear:  (data)     => request('/principal/academic-years', { method: 'POST', body: JSON.stringify(data) }),
  updateAcademicYear:  (id, data) => request(`/principal/academic-years/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  // Terms
  createTerm: (yearId, data) => request(`/principal/academic-years/${yearId}/terms`, { method: 'POST', body: JSON.stringify(data) }),
  updateTerm: (id, data)     => request(`/principal/terms/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTerm: (id)           => request(`/principal/terms/${id}`, { method: 'DELETE' }),

  // Classes
  getClasses:    ()          => request('/principal/classes'),
  getClassById:  (id)        => request(`/principal/classes/${id}`),
  createClass:   (data)      => request('/principal/classes', { method: 'POST', body: JSON.stringify(data) }),
  updateClass:   (id, data)  => request(`/principal/classes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteClass:   (id)        => request(`/principal/classes/${id}`, { method: 'DELETE' }),

  // Sections
  createSection: (classId, data) => request(`/principal/classes/${classId}/sections`, { method: 'POST', body: JSON.stringify(data) }),
  updateSection: (id, data)      => request(`/principal/sections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSection: (id)            => request(`/principal/sections/${id}`, { method: 'DELETE' }),

  // Subjects
  getSubjects:   ()          => request('/principal/subjects'),
  createSubject: (data)      => request('/principal/subjects', { method: 'POST', body: JSON.stringify(data) }),
  updateSubject: (id, data)  => request(`/principal/subjects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSubject: (id)        => request(`/principal/subjects/${id}`, { method: 'DELETE' }),

  // Curriculum
  getCurriculum:  (academic_year_id, class_id) =>
    request(`/principal/curriculum?academic_year_id=${academic_year_id}&class_id=${class_id}`),
  assignSubject:  (data) => request('/principal/curriculum', { method: 'POST', body: JSON.stringify(data) }),
  removeSubject:  (id)   => request(`/principal/curriculum/${id}`, { method: 'DELETE' }),

  // Announcements
  getAnnouncements:   (p = {}) => request(`/principal/announcements?${new URLSearchParams(p)}`),
  createAnnouncement: (data)   => request('/principal/announcements', { method: 'POST', body: JSON.stringify(data) }),
  deleteAnnouncement: (id)     => request(`/principal/announcements/${id}`, { method: 'DELETE' }),

  // School profile
  getSchoolProfile:    ()       => request('/principal/school-profile'),
  updateSchoolProfile: (data)   => request('/principal/school-profile', { method: 'PATCH', body: JSON.stringify(data) }),

  // Grading scales
  getGradingScales:    ()           => request('/principal/grading-scales'),
  createGradingScale:  (data)       => request('/principal/grading-scales', { method: 'POST', body: JSON.stringify(data) }),
  updateGradingScale:  (id, data)   => request(`/principal/grading-scales/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteGradingScale:  (id)         => request(`/principal/grading-scales/${id}`, { method: 'DELETE' }),

  // Class advisors
  getClassAdvisors:    (academic_year_id) => request(`/principal/class-advisors?academic_year_id=${academic_year_id}`),
  assignClassAdvisor:  (data)             => request('/principal/class-advisors', { method: 'POST', body: JSON.stringify(data) }),
  removeClassAdvisor:  (id)               => request(`/principal/class-advisors/${id}`, { method: 'DELETE' }),

  // Timetable
  getTimetable:         (params = {}) => request(`/principal/timetable?${new URLSearchParams(params)}`),
  createTimetableSlot:  (data)        => request('/principal/timetable', { method: 'POST', body: JSON.stringify(data) }),
  updateTimetableSlot:  (id, data)    => request(`/principal/timetable/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTimetableSlot:  (id)          => request(`/principal/timetable/${id}`, { method: 'DELETE' }),
  clearTimetable:       (data)        => request('/principal/timetable/clear', { method: 'POST', body: JSON.stringify(data) }),

  // Teachers list
  getTeacherList: () => request('/principal/teachers'),

  // Fee structures (principal side)
  getFeeStructures:    (academic_year_id) => request(`/principal/fee-structures${academic_year_id ? `?academic_year_id=${academic_year_id}` : ''}`),
  createFeeStructure:  (data)             => request('/principal/fee-structures', { method: 'POST', body: JSON.stringify(data) }),
  updateFeeStructure:  (id, data)         => request(`/principal/fee-structures/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteFeeStructure:  (id)               => request(`/principal/fee-structures/${id}`, { method: 'DELETE' }),
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
  getUserById:   (id)                => request(`/registrar/users/${id}`),
  resetPassword: (id, new_password)  => request(`/registrar/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) }),
  setUserStatus: (id, status)        => request(`/registrar/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};

// ─── Enrollment API ───────────────────────────────────────────────────────────
export const enrollmentApi = {
  getOptions: () => request('/registrar/enrollments/options'),
  getUnenrolled: (academic_year_id, search) => {
    const qs = new URLSearchParams({ academic_year_id, ...(search ? { search } : {}) }).toString();
    return request(`/registrar/enrollments/unenrolled?${qs}`);
  },
  list:    (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/registrar/enrollments${qs ? `?${qs}` : ''}`); },
  getById: (id)          => request(`/registrar/enrollments/${id}`),
  create:  (data)        => request('/registrar/enrollments',         { method: 'POST',  body: JSON.stringify(data) }),
  update:  (id, data)    => request(`/registrar/enrollments/${id}`,   { method: 'PATCH', body: JSON.stringify(data) }),
  promote: (data)        => request('/registrar/enrollments/promote', { method: 'POST',  body: JSON.stringify(data) }),
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
  getAnnouncements:    (params = {}) => { const qs = new URLSearchParams(params).toString(); return request(`/student/announcements${qs ? `?${qs}` : ''}`); },
  getAnnouncementById: (id)          => request(`/student/announcements/${id}`),
};

// ─── Parent API ───────────────────────────────────────────────────────────────
export const parentApi = {
  getDashboard:    ()                              => request('/parent/dashboard'),
  getChildren:     ()                              => request('/parent/children'),
  getChildProfile: (studentId)                     => request(`/parent/children/${studentId}/profile`),
  getChildAttendance: (studentId, year, month)     => request(`/parent/children/${studentId}/attendance?year=${year}&month=${month}`),
  getChildGrades:      (studentId)                 => request(`/parent/children/${studentId}/grades`),
  getChildReportCards: (studentId)                 => request(`/parent/children/${studentId}/report-cards`),
  getChildReportCardById: (studentId, id)          => request(`/parent/children/${studentId}/report-cards/${id}`),
  getFees:         ()                              => request('/parent/fees'),
  getFeeById:      (invoiceId)                     => request(`/parent/fees/${invoiceId}`),
  initiatePayment: (invoiceId, amount, method)     => request(`/parent/fees/${invoiceId}/pay`, { method: 'POST', body: JSON.stringify({ amount, method }) }),
  getAnnouncements:(params = {})                   => { const qs = new URLSearchParams(params).toString(); return request(`/parent/announcements${qs ? `?${qs}` : ''}`); },
  getMessages:     ()                              => request('/parent/messages'),
  getConversation: (id)                            => request(`/parent/messages/${id}`),
  startConversation: (data)                        => request('/parent/messages', { method: 'POST', body: JSON.stringify(data) }),
  sendMessage:     (convId, body)                  => request(`/parent/messages/${convId}`, { method: 'POST', body: JSON.stringify({ body }) }),
  getProfile:      ()                              => request('/parent/profile'),
  updateNotificationPrefs: (prefs)                 => request('/parent/notification-preferences', { method: 'PATCH', body: JSON.stringify(prefs) }),
};

// ─── Accountant API ───────────────────────────────────────────────────────────
export const accountantApi = {
  getDashboard:        ()        => request('/accountant/dashboard'),
  getFeeStructures:    (p = {})  => request(`/accountant/fee-structures?${new URLSearchParams(p)}`),
  createFeeStructure:  (data)    => request('/accountant/fee-structures', { method: 'POST',   body: JSON.stringify(data) }),
  updateFeeStructure:  (id, d)   => request(`/accountant/fee-structures/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  archiveFeeStructure: (id)      => request(`/accountant/fee-structures/${id}`, { method: 'DELETE' }),
  generateInvoices:    (data)    => request('/accountant/invoices/generate', { method: 'POST', body: JSON.stringify(data) }),
  getInvoices:         (p = {})  => request(`/accountant/invoices?${new URLSearchParams(p)}`),
  getInvoice:          (id)      => request(`/accountant/invoices/${id}`),
  recordPayment:       (data)    => request('/accountant/payments', { method: 'POST', body: JSON.stringify(data) }),
  getPayments:         (p = {})  => request(`/accountant/payments?${new URLSearchParams(p)}`),
  getReceipt:          (id)      => request(`/accountant/payments/${id}/receipt`),
  getCollectionsReport:(p = {})  => request(`/accountant/reports/collections?${new URLSearchParams(p)}`),
  getArrearsReport:    (p = {})  => request(`/accountant/reports/arrears?${new URLSearchParams(p)}`),
  getRevenueReport:    (p = {})  => request(`/accountant/reports/revenue?${new URLSearchParams(p)}`),
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
  getAnnouncements:(p = {})                        => request(`/teacher/announcements?${new URLSearchParams(p)}`),
};

// ─── Notification API ─────────────────────────────────────────────────────────
export const notificationApi = {
  list:              (p = {}) => request(`/notifications?${new URLSearchParams(p)}`),
  getUnreadCount:    ()       => request('/notifications/unread-count'),
  markRead:          (id)     => request(`/notifications/${id}/read`,  { method: 'PATCH' }),
  markAllRead:       ()       => request('/notifications/read-all',    { method: 'PATCH' }),
  getPreferences:    ()       => request('/notifications/preferences'),
  updatePreferences: (data)   => request('/notifications/preferences', { method: 'PATCH', body: JSON.stringify(data) }),
};

// ─── Exam API ─────────────────────────────────────────────────────────────────
export const examApi = {
  // Exam schedules
  getSchedules:    (p = {}) => request(`/exams/schedules?${new URLSearchParams(p)}`),
  createSchedule:  (data)   => request('/exams/schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule:  (id, d)  => request(`/exams/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteSchedule:  (id)     => request(`/exams/schedules/${id}`, { method: 'DELETE' }),

  // Mark components
  getComponents:    (examId)       => request(`/exams/schedules/${examId}/components`),
  saveComponents:   (examId, data) => request(`/exams/schedules/${examId}/components`, { method: 'PUT', body: JSON.stringify({ components: data }) }),

  // Mark sheet
  getMarkSheet:    (examId, section_id) => request(`/exams/schedules/${examId}/marksheet?section_id=${section_id}`),
  saveMarks:       (examId, studentId, marks) =>
    request(`/exams/schedules/${examId}/marks/${studentId}`, { method: 'POST', body: JSON.stringify({ marks }) }),

  // Report cards
  listReportCards:         (p = {})    => request(`/exams/report-cards?${new URLSearchParams(p)}`),
  getReportCard:           (id)        => request(`/exams/report-cards/${id}`),
  generateReportCard:      (data)      => request('/exams/report-cards/generate',         { method: 'POST', body: JSON.stringify(data) }),
  generateSectionCards:    (data)      => request('/exams/report-cards/generate-section', { method: 'POST', body: JSON.stringify(data) }),
  publishReportCard:       (id, pub)   => request(`/exams/report-cards/${id}/publish`,    { method: 'PATCH', body: JSON.stringify({ is_published: pub }) }),
  addRemarks:              (id, subId, remarks) =>
    request(`/exams/report-cards/${id}/remarks/${subId}`, { method: 'PATCH', body: JSON.stringify({ remarks }) }),
};
