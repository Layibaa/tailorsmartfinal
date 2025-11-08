// admin-web/src/services/api.js - Fixed with better error handling
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

console.log('API: Initializing with URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000 // 10 second timeout
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API Request:', config.method?.toUpperCase(), config.url, {
      hasToken: !!token,
      baseURL: config.baseURL
    });
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Handle responses and token expiry
api.interceptors.response.use(
  (response) => {
    console.log('API Response Success:', response.config.method?.toUpperCase(), response.config.url, {
      status: response.status,
      dataType: typeof response.data,
      hasData: !!response.data
    });
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    console.error('API Response Error:', error.config?.method?.toUpperCase(), error.config?.url, {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Handle network errors
    if (!error.response) {
      console.error('Network Error - Server may be down');
      return Promise.reject({
        message: 'Server connection failed. Please check if the server is running.',
        isNetworkError: true
      });
    }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('adminRefreshToken');
      if (refreshToken) {
        try {
          console.log('API: Attempting token refresh...');
          const response = await axios.post(`${API_URL}/auth/refresh`, { 
            refreshToken 
          });
          
          const { accessToken, refreshToken: newRefreshToken } = response.data;
          
          localStorage.setItem('adminToken', accessToken);
          if (newRefreshToken) {
            localStorage.setItem('adminRefreshToken', newRefreshToken);
          }
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          console.log('API: Token refreshed successfully, retrying request');
          return api(originalRequest);
          
        } catch (refreshError) {
          console.error('API: Token refresh failed:', refreshError);
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
          
          // Redirect to login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
          
          return Promise.reject({
            message: 'Session expired. Please login again.',
            isAuthError: true
          });
        }
      } else {
        // No refresh token, redirect to login
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
        
        return Promise.reject({
          message: 'Authentication required. Please login.',
          isAuthError: true
        });
      }
    }

    // Handle other HTTP errors
    const errorMessage = error.response?.data?.msg || 
                        error.response?.data?.message || 
                        error.message || 
                        'An unexpected error occurred';

    return Promise.reject({
      message: errorMessage,
      status: error.response?.status,
      data: error.response?.data
    });
  }
);

// Auth API
export const auth = {
  login: async (email, password) => {
    console.log('API Auth: Login attempt for:', email);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      if (response.data && response.data.accessToken) {
        const { accessToken, refreshToken, user } = response.data;
        
        console.log('API Auth: Login successful, storing tokens');
        localStorage.setItem('adminToken', accessToken);
        if (refreshToken) {
          localStorage.setItem('adminRefreshToken', refreshToken);
        }
        
        return { ...response.data, success: true };
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error) {
      console.error('API Auth: Login failed:', error);
      throw error;
    }
  },
  
  logout: async () => {
    console.log('API Auth: Logout initiated');
    const refreshToken = localStorage.getItem('adminRefreshToken');
    
    // Always clear local storage first
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    
    // Try to notify server, but don't fail if it doesn't work
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken });
        console.log('API Auth: Server logout successful');
      } catch (error) {
        console.warn('API Auth: Server logout failed (non-critical):', error.message);
      }
    }
    
    return { success: true };
  },
  
  whoami: async () => {
    console.log('API Auth: Checking current user');
    try {
      const response = await api.get('/auth/whoami');
      return response;
    } catch (error) {
      console.error('API Auth: Whoami failed:', error);
      throw error;
    }
  }
};

// Admin API
export const admin = {
  // Dashboard - with better error handling
  getDashboard: async () => {
    console.log('API Admin: Fetching dashboard data');
    try {
      const response = await api.get('/admin/dashboard');
      
      // Validate response structure
      if (!response.data || typeof response.data.success === 'undefined') {
        throw new Error('Invalid dashboard response format');
      }
      
      if (!response.data.success) {
        throw new Error(response.data.msg || 'Dashboard request failed');
      }
      
      // Ensure stats object exists
      if (!response.data.stats) {
        response.data.stats = {
          customerCount: 0,
          tailorCount: 0,
          orderCount: 0,
          orderStatusStats: {},
          weeklyOrders: 0,
          weeklyUsers: 0,
          totalRevenue: 0,
          avgOrderValue: 0,
          completedOrders: 0
        };
      }
      
      console.log('API Admin: Dashboard data received:', response.data.stats);
      return response;
    } catch (error) {
      console.error('API Admin: Dashboard fetch failed:', error);
      throw error;
    }
  },
  
  getMetrics: async () => {
    console.log('API Admin: Fetching metrics');
    try {
      const response = await api.get('/admin/metrics');
      return response;
    } catch (error) {
      console.error('API Admin: Metrics fetch failed:', error);
      throw error;
    }
  },
  
  // User Management
  getUsers: async (params = {}) => {
    console.log('API Admin: Fetching users with params:', params);
    try {
      const response = await api.get('/admin/users', { params });
      return response;
    } catch (error) {
      console.error('API Admin: Users fetch failed:', error);
      throw error;
    }
  },
  
  updateUserStatus: async (userId, status) => {
    console.log('API Admin: Updating user status:', userId, status);
    try {
      const response = await api.patch(`/admin/users/${userId}/status`, { status });
      return response;
    } catch (error) {
      console.error('API Admin: User status update failed:', error);
      throw error;
    }
  },
  
  getUser: async (userId) => {
    console.log('API Admin: Fetching user:', userId);
    try {
      const response = await api.get(`/admin/users/${userId}`);
      return response;
    } catch (error) {
      console.error('API Admin: User fetch failed:', error);
      throw error;
    }
  },
  
  // Legacy endpoints (maintain compatibility)
  getCustomers: async () => {
    try {
      const response = await api.get('/admin/customers');
      return response;
    } catch (error) {
      console.error('API Admin: Customers fetch failed:', error);
      throw error;
    }
  },
  
  getTailors: async () => {
    try {
      const response = await api.get('/admin/tailors');
      return response;
    } catch (error) {
      console.error('API Admin: Tailors fetch failed:', error);
      throw error;
    }
  },
  
  // Order Management
  getOrders: async (params = {}) => {
    console.log('API Admin: Fetching orders with params:', params);
    try {
      const response = await api.get('/admin/orders', { params });
      return response;
    } catch (error) {
      console.error('API Admin: Orders fetch failed:', error);
      throw error;
    }
  },
  
  getOrder: async (orderId) => {
    try {
      const response = await api.get(`/admin/orders/${orderId}`);
      return response;
    } catch (error) {
      console.error('API Admin: Order fetch failed:', error);
      throw error;
    }
  },
  
  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await api.patch(`/admin/orders/${orderId}/status`, { status });
      return response;
    } catch (error) {
      console.error('API Admin: Order status update failed:', error);
      throw error;
    }
  },
  
   reassignTailor: async (orderId, tailorId) => {
    try {
      const response = await api.patch(`/admin/orders/${orderId}/reassign`, { tailorId });
      return response;
    } catch (error) {
      console.error('API Admin: Tailor reassignment failed:', error);
      throw error;
    }
  },

  // System diagnostics
  getDiagnostic: async () => {
    try {
      const response = await api.get('/admin/diagnostic');
      return response;
    } catch (error) {
      console.error('API Admin: Diagnostic fetch failed:', error);
      throw error;
    }
  }
};

// Test connection function
export const testConnection = async () => {
  console.log('API: Testing connection to:', API_URL);
  try {
    // Simple connectivity test - try to hit any public endpoint
    const response = await axios.get(`${API_URL}/auth/login`, {
      timeout: 5000,
      validateStatus: () => true // Accept any status for connection test
    });
    
    console.log('API: Connection test response:', response.status, response.statusText);
    return {
      success: true,
      status: response.status,
      message: 'Server is reachable'
    };
  } catch (error) {
    console.error('API: Connection test failed:', error);
    return {
      success: false,
      error: error.code || error.message,
      message: 'Server is not reachable'
    };
  }
};



export default api;