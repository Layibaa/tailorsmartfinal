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
    console.log('API register called with:', userData);
    
    // Validate location data before sending
    if (!userData.city) {
      throw new Error('City is required');
    }
    
    if (userData.city === 'Islamabad' && !userData.region) {
      throw new Error('Region is required for Islamabad');
    }
    
    // Ensure region is null for non-Islamabad cities
    if (userData.city !== 'Islamabad') {
      userData.region = null;
    }
    
    const response = await api.post('/auth/register', userData);
    console.log('API register response:', response.data);
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
      otp
    });
    
    console.log('API verifyOtp response:', response.data);
    return response.data;
  } catch (error) {
    console.error('OTP verification error:', error.response?.data || error.message);
    throw error;
  }
};

// NEW: Get location options
export const getLocationOptions = async () => {
  try {
    const response = await api.get('/auth/locations');
    return response.data;
  } catch (error) {
    console.error('Get location options error:', error.response?.data || error.message);
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
 
// Enhanced profile update with location support
export const updateProfile = async (profileData) => {
  try {
    console.log('API updateProfile called with:', profileData);
    
    // Validate location data if provided
    if (profileData.city === 'Islamabad' && !profileData.region) {
      throw new Error('Region is required for Islamabad');
    }
    
    if (profileData.city !== 'Islamabad') {
      profileData.region = null; // Ensure region is null for non-Islamabad cities
    }
    
    const response = await api.patch('/auth/profile', profileData);
    console.log('API updateProfile response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error.response?.data || error.message);
    throw error;
  }
};
 

// Tailor API calls
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
export const getDashboardStats = async (timestamp) => {
  try {
    const queryParam = timestamp ? `?t=${timestamp}` : '';
    const response = await api.get(`/admin/dashboard${queryParam}`);
    console.log('Dashboard stats response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Get dashboard stats error:', error.response?.data || error.message);
    throw error;
  }
};

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

// Profile and account management
export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error.response?.data || error.message);
    throw error;
  }
}; 

// Update order details (measurements, notes)
export const updateOrder = async (orderId, updateData) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await axios.put(
      `${API_URL}/orders/${orderId}`,
      updateData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Update order error:', error.response?.data || error.message);
    throw error;
  }
};

// Lock/unlock order
export const lockOrder = async (orderId, isLocked) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await axios.patch(
      `${API_URL}/orders/${orderId}/lock`,
      { isLocked },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error('Lock order error:', error.response?.data || error.message);
    throw error;
  }
};

// Customer API calls - Enhanced
export const getAllTailors = async () => {
  const response = await api.get('/customers/tailors');
  return response.data;
};

export const getTailor = async (tailorId) => {
  const response = await api.get(`/customers/tailors/${tailorId}`);
  return response.data;
};

export const getCustomerProfile = async () => {
  try {
    const response = await api.get('/customers/profile');
    return response.data;
  } catch (error) {
    console.error('Get customer profile error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateCustomerProfile = async (profileData) => {
  try {
    const response = await api.put('/customers/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Update customer profile error:', error.response?.data || error.message);
    throw error;
  }
};

export const sendPasswordChangeOtp = async () => {
  try {
    const response = await api.post('/customers/password/send-otp');
    return response.data;
  } catch (error) {
    console.error('Send password change OTP error:', error.response?.data || error.message);
    throw error;
  }
};

export const updatePassword = async (passwordData) => {
  try {
    const response = await api.put('/customers/password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Update password error:', error.response?.data || error.message);
    throw error;
  }
};

export const sendDeleteAccountOtp = async () => {
  try {
    const response = await api.post('/customers/delete/send-otp');
    return response.data;
  } catch (error) {
    console.error('Send delete account OTP error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteAccount = async (otpData) => {
  try {
    const response = await api.delete('/customers/delete', { data: otpData });
    return response.data;
  } catch (error) {
    console.error('Delete account error:', error.response?.data || error.message);
    throw error;
  }
};

export const getCustomerOrders = async () => {
  const response = await api.get('/customers/orders');
  return response.data;
};

export const getCustomerOrderDetails = async (orderId) => {
  const response = await api.get(`/customers/orders/${orderId}`);
  return response.data;
};

// Add these functions to your existing services/api.js file

// Tailor Profile Management API calls
export const getTailorProfile = async () => {
  try {
    const response = await api.get('/tailors/profile');
    return response.data;
  } catch (error) {
    console.error('Get tailor profile error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateTailorProfile = async (profileData) => {
  try {
    console.log('API updateTailorProfile called with:', profileData);
    
    // Validate location data if provided
    if (profileData.city === 'Islamabad' && !profileData.region) {
      throw new Error('Region is required for Islamabad');
    }
    
    if (profileData.city !== 'Islamabad') {
      profileData.region = null; // Ensure region is null for non-Islamabad cities
    }
    
    const response = await api.put('/tailors/profile', profileData);
    console.log('API updateTailorProfile response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Update tailor profile error:', error.response?.data || error.message);
    throw error;
  }
};

export const sendTailorPasswordChangeOtp = async () => {
  try {
    const response = await api.post('/tailors/password/send-otp');
    return response.data;
  } catch (error) {
    console.error('Send tailor password change OTP error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateTailorPassword = async (passwordData) => {
  try {
    const response = await api.put('/tailors/password', passwordData);
    return response.data;
  } catch (error) {
    console.error('Update tailor password error:', error.response?.data || error.message);
    throw error;
  }
};

export const sendTailorDeleteAccountOtp = async () => {
  try {
    const response = await api.post('/tailors/delete/send-otp');
    return response.data;
  } catch (error) {
    console.error('Send tailor delete account OTP error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteTailorAccount = async (otpData) => {
  try {
    const response = await api.delete('/tailors/delete', { data: otpData });
    return response.data;
  } catch (error) {
    console.error('Delete tailor account error:', error.response?.data || error.message);
    throw error;
  }
};

export default api;