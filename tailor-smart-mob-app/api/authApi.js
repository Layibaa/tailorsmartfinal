import axios from 'axios';

// Base URL for API calls
const API_URL = 'http://localhost:8000/api';

// Create customer account
export const customerSignup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/customer/signup`, userData);
    return response.data;
  } catch (error) {
    console.error('Customer signup error:', error.response?.data || error.message);
    throw error;
  }
};

// Create tailor account
export const tailorSignup = async (userData) => {
  try {
    const response = await axios.post(`${API_URL}/auth/tailor/signup`, userData);
    return response.data;
  } catch (error) {
    console.error('Tailor signup error:', error.response?.data || error.message);
    throw error;
  }
};

// Login (customer or tailor)
export const login = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, { email, password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

// Admin login
export const adminLogin = async (username, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/admin/login`, { username, password });
    return response.data;
  } catch (error) {
    console.error('Admin login error:', error.response?.data || error.message);
    throw error;
  }
};

// Verify OTP
export const verifyOtp = async (email, otp) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
    return response.data;
  } catch (error) {
    console.error('OTP verification error:', error.response?.data || error.message);
    throw error;
  }
};

// Forgot password
export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error.response?.data || error.message);
    throw error;
  }
};

// Reset password
export const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, { 
      email, 
      otp, 
      newPassword 
    });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error.response?.data || error.message);
    throw error;
  }
};

// Create axios instance with auth header
export const createAuthenticatedAxios = (token) => {
  const instance = axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  return instance;
};