import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../utils/constants';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    } catch (error) {
      console.error('Error adding token to request:', error);
      return config;
    }
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle errors globally
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Handle network errors
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Handle API errors
    const { status, data } = error.response;
    
    if (status === 401) {
      // Unauthorized - token expired or invalid
      // You can handle token refresh or logout here
      console.log('Unauthorized access, redirecting to login');
      // TODO: Trigger logout if needed
    }
    
    // Return the error message from the API if available
    const errorMessage = data.message || 'Something went wrong';
    return Promise.reject(new Error(errorMessage));
  }
);

// Authentication Endpoints
export const loginUser = (email, password) => {
  return api.post('/api/auth/login', { email, password });
};

export const registerUser = (userData) => {
  return api.post('/api/auth/register', userData);
};

export const getCurrentUser = () => {
  return api.get('/api/auth/me');
};

// User & Profile Endpoints
export const fetchUserProfile = () => {
  return api.get('/api/users/profile');
};

export const updateUserProfile = (profileData) => {
  return api.put('/api/users/profile', profileData);
};

export const updateUserSettings = (settings) => {
  return api.put('/api/users/settings', settings);
};

export const deleteAccount = () => {
  return api.delete('/api/users/account');
};

// Tailor Endpoints
export const fetchTailors = () => {
  return api.get('/api/tailors');
};

export const fetchFeaturedTailors = () => {
  return api.get('/api/tailors/featured');
};

export const fetchTailorDetails = (tailorId) => {
  return api.get(`/api/tailors/${tailorId}`);
};

export const fetchTailorProfile = () => {
  return api.get('/api/tailors/profile');
};

export const updateTailorProfile = (profileData) => {
  return api.put('/api/tailors/profile', profileData);
};

// Order Endpoints
export const fetchOrders = (status = null) => {
  const params = status ? { status } : {};
  return api.get('/api/orders', { params });
};

export const fetchRecentOrders = () => {
  return api.get('/api/orders/recent');
};

export const fetchOrderDetails = (orderId) => {
  return api.get(`/api/orders/${orderId}`);
};

export const createOrder = (orderData) => {
  return api.post('/api/orders', orderData);
};

export const updateOrderStatus = (orderId, status) => {
  return api.put(`/api/orders/${orderId}/status`, { status });
};

export const deleteOrder = (orderId) => {
  return api.delete(`/api/orders/${orderId}`);
};

// Chat Endpoints
export const fetchChatList = () => {
  return api.get('/api/chat/list');
};

export const fetchMessages = (userId) => {
  return api.get(`/api/chat/messages/${userId}`);
};

export const sendMessage = (receiverId, content) => {
  return api.post('/api/chat/messages', { receiverId, content });
};

// Notification Endpoints
export const fetchNotifications = () => {
  return api.get('/api/notifications');
};

export const markNotificationAsRead = (notificationId) => {
  return api.put(`/api/notifications/${notificationId}/read`);
};

// Admin Endpoints
export const fetchAdminMetrics = () => {
  return api.get('/api/admin/metrics');
};

export default api;
