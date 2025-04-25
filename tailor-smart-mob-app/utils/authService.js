import axios from 'axios';

// Base URL for API endpoints
const API_URL = 'http://localhost:8000/api/auth';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Set JWT token for authenticated requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Authentication service functions
const authService = {
  // Register a new user (customer or tailor)
  register: async (userData, userType) => {
    try {
      const response = await api.post('/signup', {
        ...userData,
        role: userType,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'An error occurred during registration' };
    }
  },

  // Login user
  login: async (mobileNumber, password) => {
    try {
      const response = await api.post('/login', {
        mobileNumber,
        password,
      });
      
      // Set the token in axios headers for subsequent requests
      if (response.data.token) {
        setAuthToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Invalid credentials' };
    }
  },

  // Admin login
  adminLogin: async (username, password) => {
    try {
      const response = await api.post('/admin-login', {
        username,
        password,
      });
      
      // Set the token in axios headers for subsequent requests
      if (response.data.token) {
        setAuthToken(response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Invalid admin credentials' };
    }
  },

  // Verify OTP
  verifyOTP: async (mobileNumber, otp) => {
    try {
      const response = await api.post('/verify-otp', {
        mobileNumber,
        otp,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'OTP verification failed' };
    }
  },

  // Forgot password
  forgotPassword: async (mobileNumber) => {
    try {
      const response = await api.post('/forgot-password', {
        mobileNumber,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to process forgot password request' };
    }
  },

  // Reset password
  resetPassword: async (mobileNumber, newPassword) => {
    try {
      const response = await api.post('/reset-password', {
        mobileNumber,
        newPassword,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || { message: 'Failed to reset password' };
    }
  },

  // Logout
  logout: () => {
    setAuthToken(null);
  },
};

export default authService;
