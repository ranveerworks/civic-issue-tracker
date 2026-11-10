import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
export const API_URL = import.meta.env.VITE_API_URL || `${API_BASE_URL}/api`;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civic_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or expired
      const path = window.location.pathname;
      if (path !== '/login' && path !== '/register') {
        localStorage.removeItem('civic_token');
        localStorage.removeItem('civic_user');
      }
    }
    return Promise.reject(error);
  }
);

// Helper to get absolute image URL
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${API_BASE_URL}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
};

// API Endpoints
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const complaintsAPI = {
  create: (formData) => api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  checkDuplicate: (data) => api.post('/complaints/check-duplicate', data),
  getMyComplaints: (params) => api.get('/complaints/my', { params }),
  getPublicComplaints: (params) => api.get('/complaints', { params }),
  getById: (identifier) => api.get(`/complaints/${identifier}`),
  getHistory: (identifier) => api.get(`/complaints/${identifier}/history`),
  update: (identifier, formData) => api.put(`/complaints/${identifier}`, formData),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAllComplaints: (params) => api.get('/admin/complaints', { params }),
  updateStatus: (identifier, data) => api.put(`/admin/complaints/${identifier}/status`, data),
  getStatistics: () => api.get('/admin/statistics'),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

export default api;
