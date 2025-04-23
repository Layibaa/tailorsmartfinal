import axios from 'axios';
import { API_URL } from './config';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add logging for debug purposes
api.interceptors.request.use(request => {
  console.log('Starting API Request:', request.method.toUpperCase(), request.url);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('API Response Success:', response.config.method.toUpperCase(), response.config.url);
    return response;
  },
  error => {
    console.log('API Response Error:', error.message);
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data));
    }
    return Promise.reject(error);
  }
);

// Add authorization header
const authHeader = (token) => {
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// Handle API errors
const handleError = (error) => {
  let message = 'An unexpected error occurred';
  let status = 500;

  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    message = error.response.data.message || error.response.data || message;
    status = error.response.status;
  } else if (error.request) {
    // The request was made but no response was received
    message = 'Server did not respond. Please check your connection';
  } else {
    // Something happened in setting up the request that triggered an Error
    message = error.message;
  }

  const customError = new Error(message);
  customError.status = status;
  return customError;
};

// Authentication APIs
export const login = async (email, password) => {
  try {
    const response = await api.post('/api/auth/login', { email, password });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/api/auth/register', userData);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const logout = async (token) => {
  try {
    const response = await api.post(
      '/api/auth/logout',
      {},
      { headers: authHeader(token) }
    );
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const getCurrentUser = async (token) => {
  try {
    const response = await api.get('/api/users/me', {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

// User APIs
export const updateProfile = async (token, userData) => {
  try {
    const response = await api.put('/api/users/profile', userData, {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

// Order APIs
export const getOrders = async (token) => {
  try {
    const response = await api.get('/api/orders', {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const getOrderDetails = async (token, orderId) => {
  try {
    const response = await api.get(`/api/orders/${orderId}`, {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const createOrder = async (token, orderData) => {
  try {
    const response = await api.post('/api/orders', orderData, {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const updateOrder = async (token, orderId, orderData) => {
  try {
    const response = await api.put(`/api/orders/${orderId}`, orderData, {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const updateOrderStatus = async (token, orderId, statusData) => {
  try {
    const response = await api.patch(
      `/api/orders/${orderId}/status`,
      statusData,
      {
        headers: authHeader(token),
      }
    );
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const cancelOrder = async (token, orderId) => {
  try {
    const response = await api.delete(`/api/orders/${orderId}`, {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

// Admin APIs
export const getUsers = async (token) => {
  try {
    const response = await api.get('/api/admin/users', {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const getUserDetails = async (token, userId) => {
  try {
    const response = await api.get(`/api/admin/users/${userId}`, {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const updateUser = async (token, userId, userData) => {
  try {
    const response = await api.put(`/api/admin/users/${userId}`, userData, {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const updateUserStatus = async (token, userId, statusData) => {
  try {
    const response = await api.patch(
      `/api/admin/users/${userId}/status`,
      statusData,
      {
        headers: authHeader(token),
      }
    );
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const getAllOrders = async (token) => {
  try {
    const response = await api.get('/api/admin/orders', {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export const getDashboardStats = async (token) => {
  try {
    const response = await api.get('/api/admin/dashboard', {
      headers: authHeader(token),
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
};

export default {
  login,
  register,
  logout,
  getCurrentUser,
  updateProfile,
  getOrders,
  getOrderDetails,
  createOrder,
  updateOrder,
  updateOrderStatus,
  cancelOrder,
  getUsers,
  getUserDetails,
  updateUser,
  updateUserStatus,
  getAllOrders,
  getDashboardStats,
};
