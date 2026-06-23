import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wms_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wms_token');
      localStorage.removeItem('wms_user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

export const warehouseApi = {
  getAll: () => api.get('/warehouses'),
  getById: (id) => api.get(`/warehouses/${id}`),
  create: (data) => api.post('/warehouses', data),
  update: (id, data) => api.put(`/warehouses/${id}`, data),
  delete: (id) => api.delete(`/warehouses/${id}`),
};

export const productApi = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
};

export const categoryApi = {
  getAll: () => api.get('/categories'),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

export const customerApi = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
};

export const locationApi = {
  getAll: (params) => api.get('/locations', { params }),
  suggest: (params) => api.get('/locations/suggest', { params }),
};

export const inventoryApi = {
  getPivot: () => api.get('/inventory/pivot'),
  getByWarehouse: (params) => api.get('/inventory', { params }),
  getStock: (productId) => api.get(`/inventory/stock/${productId}`),
  trace: (productId) => api.get(`/inventory/trace/${productId}`),
};

export const inboundApi = {
  getAll: (params) => api.get('/inbound', { params }),
  getById: (id) => api.get(`/inbound/${id}`),
  create: (data) => api.post('/inbound', data),
  approve: (id) => api.put(`/inbound/${id}/approve`),
  reject: (id) => api.put(`/inbound/${id}/reject`),
  suggestBins: (params) => api.get('/inbound/suggest-bins', { params }),
};

export const outboundApi = {
  getAll: (params) => api.get('/outbound', { params }),
  getById: (id) => api.get(`/outbound/${id}`),
  create: (data) => api.post('/outbound', data),
  approve: (id) => api.put(`/outbound/${id}/approve`),
  complete: (id) => api.put(`/outbound/${id}/complete`),
  reject: (id) => api.put(`/outbound/${id}/reject`),
};

export const salesApi = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  approve: (id) => api.put(`/sales/${id}/approve`),
  reject: (id) => api.put(`/sales/${id}/reject`),
  checkStock: (params) => api.get('/sales/stock-check', { params }),
};

export const reportApi = {
  getDashboard: () => api.get('/reports/dashboard'),
  getInventorySummary: () => api.get('/reports/inventory-summary'),
  getInboundSummary: (params) => api.get('/reports/inbound-summary', { params }),
  getOutboundSummary: (params) => api.get('/reports/outbound-summary', { params }),
  getSalesSummary: (params) => api.get('/reports/sales-summary', { params }),
};

export const userApi = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

export default api;
