// admin-web/src/services/api.js - Enhanced with debugging
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

console.log('API: Initializing with URL:', API_URL);

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
  console.log('API Request:', config.method?.toUpperCase(), config.url, {
    hasToken: !!token,
    data: config.data
  });
  return config;
});

// Handle token expiry
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.method?.toUpperCase(), response.config.url, {
      status: response.status,
      data: response.data
    });
    return response;
  },
  async (error) => {
    console.error('API Error:', error.config?.method?.toUpperCase(), error.config?.url, {
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (refreshToken) {
        try {
          console.log('API: Attempting token refresh...');
          const response = await api.post('/auth/refresh', { refreshToken });
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          localStorage.setItem('adminToken', accessToken);
          localStorage.setItem('adminRefreshToken', newRefreshToken);
          
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          console.log('API: Token refreshed, retrying request');
          return api.request(error.config);
        } catch (refreshError) {
          console.error('API: Token refresh failed:', refreshError);
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
    console.log('API Auth: Login called for:', email);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      const { accessToken, refreshToken } = response.data;
      
      console.log('API Auth: Login successful, storing tokens');
      localStorage.setItem('adminToken', accessToken);
      localStorage.setItem('adminRefreshToken', refreshToken);
      
      return response.data;
    } catch (error) {
      console.error('API Auth: Login failed:', error);
      throw error;
    }
  },
  
  logout: async () => {
    console.log('API Auth: Logout called');
    const refreshToken = localStorage.getItem('adminRefreshToken');
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
      } catch (error) {
        console.error('API Auth: Logout error (non-critical):', error);
      }
    }
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
  },
  
  whoami: () => {
    console.log('API Auth: Whoami called');
    return api.get('/auth/whoami');
  }
};

// Admin API
export const admin = {
  // Dashboard
  getDashboard: () => {
    console.log('API Admin: getDashboard called');
    return api.get('/admin/dashboard');
  },
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