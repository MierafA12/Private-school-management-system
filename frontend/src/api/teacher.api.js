import { request } from './client';

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
