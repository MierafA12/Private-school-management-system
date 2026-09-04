import { request } from './client';

export const registrarApi = {
  registerStudent: (data) => request('/registrar/students', { method: 'POST', body: JSON.stringify(data) }),
  registerParent:  (data) => request('/registrar/parents',  { method: 'POST', body: JSON.stringify(data) }),
  registerTeacher: (data) => request('/registrar/teachers', { method: 'POST', body: JSON.stringify(data) }),
  registerStaff:   (data) => request('/registrar/staff',    { method: 'POST', body: JSON.stringify(data) }),
  getUsers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/registrar/users${qs ? `?${qs}` : ''}`);
  },
  getUserById:   (id)               => request(`/registrar/users/${id}`),
  resetPassword: (id, new_password) => request(`/registrar/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ new_password }) }),
  setUserStatus: (id, status)       => request(`/registrar/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
};
