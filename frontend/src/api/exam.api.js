import { request } from './client';

export const examApi = {
  // Exam schedules
  getSchedules:   (p = {}) => request(`/exams/schedules?${new URLSearchParams(p)}`),
  createSchedule: (data)   => request('/exams/schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id, d)  => request(`/exams/schedules/${id}`, { method: 'PATCH', body: JSON.stringify(d) }),
  deleteSchedule: (id)     => request(`/exams/schedules/${id}`, { method: 'DELETE' }),

  // Mark components
  getComponents:  (examId)       => request(`/exams/schedules/${examId}/components`),
  saveComponents: (examId, data) => request(`/exams/schedules/${examId}/components`, { method: 'PUT', body: JSON.stringify({ components: data }) }),

  // Mark sheet
  getMarkSheet:   (examId, section_id) => request(`/exams/schedules/${examId}/marksheet?section_id=${section_id}`),
  saveMarks:      (examId, studentId, marks) =>
    request(`/exams/schedules/${examId}/marks/${studentId}`, { method: 'POST', body: JSON.stringify({ marks }) }),

  // Report cards
  listReportCards:      (p = {})    => request(`/exams/report-cards?${new URLSearchParams(p)}`),
  getReportCard:        (id)        => request(`/exams/report-cards/${id}`),
  generateReportCard:   (data)      => request('/exams/report-cards/generate',         { method: 'POST', body: JSON.stringify(data) }),
  generateSectionCards: (data)      => request('/exams/report-cards/generate-section', { method: 'POST', body: JSON.stringify(data) }),
  publishReportCard:    (id, pub)   => request(`/exams/report-cards/${id}/publish`,    { method: 'PATCH', body: JSON.stringify({ is_published: pub }) }),
  addRemarks:           (id, subId, remarks) =>
    request(`/exams/report-cards/${id}/remarks/${subId}`, { method: 'PATCH', body: JSON.stringify({ remarks }) }),
};
