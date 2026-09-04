import { request } from './client';

export const notificationApi = {
  list:              (p = {}) => request(`/notifications?${new URLSearchParams(p)}`),
  getUnreadCount:    ()       => request('/notifications/unread-count'),
  markRead:          (id)     => request(`/notifications/${id}/read`,  { method: 'PATCH' }),
  markAllRead:       ()       => request('/notifications/read-all',    { method: 'PATCH' }),
  getPreferences:    ()       => request('/notifications/preferences'),
  updatePreferences: (data)   => request('/notifications/preferences', { method: 'PATCH', body: JSON.stringify(data) }),
};
