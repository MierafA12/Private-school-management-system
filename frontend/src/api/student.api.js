import { request } from './client';

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
