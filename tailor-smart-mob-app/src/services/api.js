import axios from 'axios';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';


// Get API URL from app.json or use default
export const API_URL = Constants.manifest?.extra?.apiUrl || 'http://192.168.1.91:8000/api/v1';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log the error for debugging
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Auth API calls
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);
    throw error;
  }
};

export const register = async (userData) => {
  try {
    const response = await api.post('/auth/register', userData);
    return response.data;
  } catch (error) {
    console.error('Register error:', error.response?.data || error.message);
    throw error;
  }
};

export const verifyOtp = async (userId, otp) => {
  try {
    if (!userId) {
      throw new Error('User ID is required for OTP verification');
    }
    
    if (!otp || otp.length !== 6) {
      throw new Error('Valid 6-digit OTP is required');
    }
    
    console.log('API verifyOtp request payload:', { userId, otp });
    
    const response = await api.post('/auth/verify-otp', { 
      userId, 
      otp,
      // Add any other required fields your API might expect
    });
    
    console.log('API verifyOtp response:', response.data);
    return response.data;
  } catch (error) {
    console.error('OTP verification error:', error.response?.data || error.message);
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  } catch (error) {
    console.error('Forgot password error:', error.response?.data || error.message);
    throw error;
  }
};

export const resetPassword = async (resetToken, password) => {
  try {
    const response = await api.put(`/auth/reset-password/${resetToken}`, { password });
    return response.data;
  } catch (error) {
    console.error('Reset password error:', error.response?.data || error.message);
    throw error;
  }
};

export const resendOtp = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required for resending OTP');
    }
    
    console.log('Resending OTP for userId:', userId);
    const response = await api.post('/auth/resend-otp', { userId });
    return response.data;
  } catch (error) {
    console.error('Resend OTP error:', error.response?.data || error.message);
    throw error;
  }
};

// Customer API calls
export const getAllTailors = async () => {
  const response = await api.get('/customers/tailors');
  return response.data;
};

export const getTailor = async (tailorId) => {
  const response = await api.get(`/customers/tailors/${tailorId}`);
  return response.data;
};

export const updateCustomerProfile = async (profileData) => {
  const response = await api.patch('/customers/profile', profileData);
  return response.data;
};

export const getCustomerOrders = async () => {
  const response = await api.get('/customers/orders');
  return response.data;
};

export const getCustomerOrderDetails = async (orderId) => {
  const response = await api.get(`/customers/orders/${orderId}`);
  return response.data;
};

// Tailor API calls
export const updateTailorProfile = async (profileData) => {
  const response = await api.patch('/tailors/profile', profileData);
  return response.data;
};

export const getTailorOrders = async () => {
  const response = await api.get('/tailors/orders');
  return response.data;
};

export const getTailorOrderDetails = async (orderId) => {
  const response = await api.get(`/tailors/orders/${orderId}`);
  return response.data;
};

export const getPendingOrders = async () => {
  const response = await api.get('/tailors/orders/pending');
  return response.data;
};

export const getActiveOrders = async () => {
  const response = await api.get('/tailors/orders/active');
  return response.data;
};

export const getCompletedOrders = async () => {
  const response = await api.get('/tailors/orders/completed');
  return response.data;
};

// Admin API calls
// Admin API calls
export const getDashboardStats = async (timestamp) => {
  try {
    // Add timestamp as a query parameter to bust cache
    const queryParam = timestamp ? `?t=${timestamp}` : '';
    const response = await api.get(`/admin/dashboard${queryParam}`);
    
    // Log the response for debugging
    console.log('Dashboard stats response:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('Get dashboard stats error:', error.response?.data || error.message);
    throw error;
  }
};
// Add this to your api.js file

export const getDiagnosticData = async () => {
  try {
    const response = await api.get('/admin/diagnostic');
    console.log('Diagnostic data:', response.data);
    return response.data;
  } catch (error) {
    console.error('Diagnostic API error:', error);
    throw error;
  }
};

export const getAllCustomers = async () => {
  const response = await api.get('/admin/customers');
  return response.data;
};

export const getAllTailorsAdmin = async () => {
  const response = await api.get('/admin/tailors');
  return response.data;
};

export const getAllOrdersAdmin = async () => {
  const response = await api.get('/admin/orders');
  return response.data;
};

export const getCustomerDetails = async (customerId) => {
  const response = await api.get(`/admin/customers/${customerId}`);
  return response.data;
};

export const getTailorDetailsAdmin = async (tailorId) => {
  const response = await api.get(`/admin/tailors/${tailorId}`);
  return response.data;
};

export const getOrderDetailsAdmin = async (orderId) => {
  const response = await api.get(`/admin/orders/${orderId}`);
  return response.data;
};

// Order API calls
export const createOrder = async (orderData) => {
  console.log('API createOrder called with:', orderData);
  try {
    console.log('Making POST request to /orders');
    // Make sure we're properly sending the authenticated request
    // The user ID should be extracted from the token by the auth middleware
    const response = await api.post('/orders', orderData);
    
    console.log('API createOrder response:', response.data);
    return response.data;
  } catch (error) {
    console.error('API createOrder error:', error.message);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw error;
  }
};
export const deleteOrder = async (orderId) => {
  try {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Delete order error:', error.response?.data || error.message);
    throw error;
  }
};
export const updateOrderStatus = async (orderId, statusData) => {
  const response = await api.patch(`/orders/${orderId}/status`, statusData);
  return response.data;
};

export const confirmOrder = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/confirm`, {});
  return response.data;
};

// Message API calls
// FIXING BUG
export const sendMessage = async (messageData) => {
  try {
    console.log('Sending message via API:', messageData);
    const response = await api.post('/messages', {
      receiverId: messageData.receiverId,
      content: messageData.content,
      orderId: messageData.orderId || null
    });
    console.log('API response for sendMessage:', response.data);
    return response.data;
  } catch (error) {
    console.error("API Error in sendMessage:", error.response?.data || error.message);
    throw error;
  }
};

export const getConversation = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is missing!');
    console.log(`Getting conversation with user ${userId}`);
    const response = await api.get(`/messages/conversations/${userId}`);
    return response.data;
  } catch (error) {
    console.error("API Error in getConversation:", error.response?.data || error.message);
    throw error;
  }
};

export const getAllConversations = async () => {
  try {
    console.log('Getting all conversations');
    const response = await api.get('/messages/conversations');
    return response.data;
  } catch (error) {
    console.error("API Error in getAllConversations:", 
      error.response?.data?.message || error.message);
    throw error;
  }
};

export const markConversationAsRead = async (conversationId) => {
  try {
    console.log(`Marking conversation ${conversationId} as read`);
    const response = await api.patch(`/messages/conversations/${conversationId}/read`);
    return response.data;
  } catch (error) {
    console.error("API Error in markConversationAsRead:", 
      error.response?.data?.message || error.message);
    throw error;
  }
};

export const getUnreadCount = async () => {
  const response = await api.get('/messages/unread');
  return response.data;
};


export default api;