import { request } from './client';

export const parentApi = {
  getDashboard:            ()                              => request('/parent/dashboard'),
  getChildren:             ()                              => request('/parent/children'),
  getChildProfile:         (studentId)                     => request(`/parent/children/${studentId}/profile`),
  getChildAttendance:      (studentId, year, month)        => request(`/parent/children/${studentId}/attendance?year=${year}&month=${month}`),
  getChildGrades:          (studentId)                     => request(`/parent/children/${studentId}/grades`),
  getChildReportCards:     (studentId)                     => request(`/parent/children/${studentId}/report-cards`),
  getChildReportCardById:  (studentId, id)                 => request(`/parent/children/${studentId}/report-cards/${id}`),
  getFees:                 ()                              => request('/parent/fees'),
  getFeeById:              (invoiceId)                     => request(`/parent/fees/${invoiceId}`),
  initiatePayment:         (invoiceId, amount, method)     => request(`/parent/fees/${invoiceId}/pay`, { method: 'POST', body: JSON.stringify({ amount, method }) }),
  getAnnouncements:        (params = {})                   => { const qs = new URLSearchParams(params).toString(); return request(`/parent/announcements${qs ? `?${qs}` : ''}`); },
  getEvents:               (params = {})                   => { const qs = new URLSearchParams(params).toString(); return request(`/parent/events${qs ? `?${qs}` : ''}`); },
  rsvpEvent:               (eventId, response)             => request(`/parent/events/${eventId}/rsvp`, { method: 'POST', body: JSON.stringify({ response }) }),
  getMessages:             ()                              => request('/parent/messages'),
  getConversation:         (id)                            => request(`/parent/messages/${id}`),
  startConversation:       (data)                          => request('/parent/messages', { method: 'POST', body: JSON.stringify(data) }),
  sendMessage:             (convId, body)                  => request(`/parent/messages/${convId}`, { method: 'POST', body: JSON.stringify({ body }) }),
  getProfile:              ()                              => request('/parent/profile'),
  updateNotificationPrefs: (prefs)                         => request('/parent/notification-preferences', { method: 'PATCH', body: JSON.stringify(prefs) }),
};
