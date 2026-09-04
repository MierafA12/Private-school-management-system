import { request } from './client';

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
