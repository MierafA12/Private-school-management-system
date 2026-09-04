import { request } from './client';

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
