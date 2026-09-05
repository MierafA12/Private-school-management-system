import { request } from './client';

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
  createSection:            (classId, data)             => request(`/principal/classes/${classId}/sections`, { method: 'POST', body: JSON.stringify(data) }),
  updateSection:            (id, data)                  => request(`/principal/sections/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteSection:            (id)                        => request(`/principal/sections/${id}`, { method: 'DELETE' }),
  getSectionStudents:       (sectionId)                 => request(`/principal/sections/${sectionId}/students`),
  getUnenrolledStudents:    (search)                    => request(`/principal/unenrolled-students${search ? `?search=${encodeURIComponent(search)}` : ''}`),
  enrollStudentToSection:   (sectionId, data)           => request(`/principal/sections/${sectionId}/enroll`, { method: 'POST', body: JSON.stringify(data) }),
  removeStudentFromSection: (sectionId, enrollmentId)   => request(`/principal/sections/${sectionId}/students/${enrollmentId}`, { method: 'DELETE' }),

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
