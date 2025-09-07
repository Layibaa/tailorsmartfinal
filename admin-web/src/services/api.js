// admin-web/src/services/api.js - Updated with user management endpoints
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiry
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (refreshToken) {
        try {
          const response = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          localStorage.setItem('adminToken', accessToken);
          localStorage.setItem('adminRefreshToken', newRefreshToken);
          
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return api.request(error.config);
        } catch (refreshError) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const auth = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken } = response.data;
    
    localStorage.setItem('adminToken', accessToken);
    localStorage.setItem('adminRefreshToken', refreshToken);
    
    return response.data;
  },
  
  logout: async () => {
    const refreshToken = localStorage.getItem('adminRefreshToken');
    if (refreshToken) {
      await api.post('/auth/logout', { refreshToken });
    }
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
  },
  
  whoami: () => api.get('/auth/whoami')
};

// Admin API
export const admin = {
  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),
  getMetrics: () => api.get('/admin/metrics'),
  
  // User Management - ENHANCED
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (userId, status) => 
    api.patch(`/admin/users/${userId}/status`, { status }),
  getUser: (userId) => api.get(`/admin/users/${userId}`),
  
  // Legacy endpoints (keep for backward compatibility)
  getCustomers: () => api.get('/admin/customers'),
  getTailors: () => api.get('/admin/tailors'),
  
  // Order Management
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (orderId) => api.get(`/admin/orders/${orderId}`),
  updateOrderStatus: (orderId, status) => 
    api.patch(`/admin/orders/${orderId}/status`, { status }),
  reassignTailor: (orderId, tailorId) => 
    api.patch(`/admin/orders/${orderId}/reassign`, { tailorId })
};

export default api;