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
  },
  timeout: 15000 // 15 second timeout
});

// Add request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('userToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      console.log(`📤 ${config.method.toUpperCase()} ${config.url}`);
      return config;
    } catch (error) {
      console.error('❌ Request interceptor error:', error);
      return config;
    }
  },
  (error) => {
    console.error('❌ Request setup error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors consistently
api.interceptors.response.use(
  (response) => {
    console.log(`✅ Response from ${response.config.url}:`, response.status);
    return response;
  },
  async (error) => {
    // Log detailed error information
    console.error('❌ API Error Details:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Handle network errors (no response from server)
    if (!error.response) {
      console.error('🔌 Network Error: Server might be down or unreachable');
      return Promise.reject({
        message: 'Cannot connect to server. Please check:\n1. Server is running\n2. API URL is correct\n3. Internet connection',
        isNetworkError: true
      });
    }

    // Handle 401 Unauthorized
    if (error.response.status === 401) {
      console.warn('🚫 Unauthorized request');
      
      // Don't clear tokens during login/register attempts
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                            error.config?.url?.includes('/auth/register');
      
      if (!isAuthEndpoint) {
        console.log('🧹 Clearing expired tokens');
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('user');
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// AUTH API CALLS - FIXED
// ============================================

export const login = async (email, password) => {
  try {
    console.log('🔐 Login attempt for:', email);
    
    // Validate inputs
    if (!email || !password) {
      throw new Error('Email and password are required');
    }
    
    // Trim and normalize email to lowercase (matching server behavior)
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    
    console.log('📧 Normalized email:', normalizedEmail);
    
    const response = await api.post('/auth/login', { 
      email: normalizedEmail, 
      password: trimmedPassword 
    });
    
    console.log('✅ Login successful:', {
      hasToken: !!response.data.token,
      hasUser: !!response.data.user,
      userRole: response.data.user?.role
    });
    
    // Store token if present
    if (response.data.token || response.data.accessToken) {
      const token = response.data.token || response.data.accessToken;
      await AsyncStorage.setItem('userToken', token);
      console.log('💾 Token stored');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ Login error:', {
      status: error.response?.status,
      message: error.response?.data?.msg || error.message,
      data: error.response?.data
    });
    
    // Throw user-friendly error
    if (error.isNetworkError) {
      throw new Error('Cannot connect to server. Please check if the server is running.');
    } else if (error.response?.status === 401) {
      throw new Error(error.response.data?.msg || 'Invalid email or password');
    } else if (error.response?.status === 400) {
      throw new Error(error.response.data?.msg || 'Please provide valid credentials');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    throw error;
  }
};

export const register = async (userData) => {
  try {
    console.log('📝 Register attempt with:', {
      email: userData.email,
      role: userData.role,
      city: userData.city,
      region: userData.region
    });
    
    // Validate location data before sending
    if (!userData.city) {
      throw new Error('City is required');
    }
    
    if (userData.city === 'Islamabad' && !userData.region) {
      throw new Error('Region is required for Islamabad');
    }
    
    // Normalize email
    const normalizedData = {
      ...userData,
      email: userData.email.trim().toLowerCase()
    };
    
    // Ensure region is null for non-Islamabad cities
    if (normalizedData.city !== 'Islamabad') {
      normalizedData.region = null;
    }
    
    const response = await api.post('/auth/register', normalizedData);
    console.log('✅ Registration successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Register error:', error.response?.data || error.message);
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
    
    console.log('🔢 Verifying OTP for userId:', userId);
    
    const response = await api.post('/auth/verify-otp', { 
      userId, 
      otp: otp.toString()
    });
    
    console.log('✅ OTP verification successful');
    
    // Store token if present
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
      console.log('💾 Token stored after verification');
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ OTP verification error:', error.response?.data || error.message);
    throw error;
  }
};

// ============================================
// LOCATION API
// ============================================

export const getLocationOptions = async () => {
  try {
    const response = await api.get('/auth/locations');
    return response.data;
  } catch (error) {
    console.error('Get location options error:', error.response?.data || error.message);
    throw error;
  }
};

// ============================================
// PASSWORD MANAGEMENT
// ============================================

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
    
    console.log('📤 Resending OTP for userId:', userId);
    const response = await api.post('/auth/resend-otp', { userId });
    return response.data;
  } catch (error) {
    console.error('Resend OTP error:', error.response?.data || error.message);
    throw error;
  }
};

// ============================================
// PROFILE MANAGEMENT
// ============================================

export const updateProfile = async (profileData) => {
  try {
    console.log('📝 Updating profile with:', profileData);
    
    // Validate location data if provided
    if (profileData.city === 'Islamabad' && !profileData.region) {
      throw new Error('Region is required for Islamabad');
    }
    
    if (profileData.city && profileData.city !== 'Islamabad') {
      profileData.region = null;
    }
    
    const response = await api.patch('/auth/profile', profileData);
    console.log('✅ Profile updated successfully');
    return response.data;
  } catch (error) {
    console.error('Update profile error:', error.response?.data || error.message);
    throw error;
  }
};

export const getUserProfile = async () => {
  try {
    const response = await api.get('/auth/me');
    return response.data;
  } catch (error) {
    console.error('Get profile error:', error.response?.data || error.message);
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

// ============================================
// TAILOR APIs
// ============================================

export const getAllTailors = async (filters = {}) => {
  try {
    let url = '/tailors';
    const params = new URLSearchParams();
    
    if (filters.city) {
      params.append('city', filters.city);
    }
    
    if (filters.region && filters.city === 'Islamabad') {
      params.append('region', filters.region);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log('📍 Fetching tailors from:', url);
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Get all tailors error:', error.response?.data || error.message);
    throw error;
  }
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
    console.log('📝 Updating tailor profile with:', profileData);
    
    if (profileData.city === 'Islamabad' && !profileData.region) {
      throw new Error('Region is required for Islamabad');
    }
    
    if (profileData.city !== 'Islamabad') {
      profileData.region = null;
    }
    
    const response = await api.put('/tailors/profile', profileData);
    return response.data;
  } catch (error) {
    console.error('Update tailor profile error:', error.response?.data || error.message);
    throw error;
  }
};

// ============================================
// ORDER APIs
// ============================================

export const createOrder = async (orderData) => {
  console.log('📦 Creating order with:', orderData);
  try {
    const response = await api.post('/orders', orderData);
    console.log('✅ Order created:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ Create order error:', error.response?.data || error.message);
    throw error;
  }
};

export const getOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Get order details error:', error.response?.data || error.message);
    throw error;
  }
};

export const updateOrder = async (orderId, updateData) => {
  try {
    console.log(`📝 Updating order ${orderId} with:`, updateData);
    const response = await api.put(`/orders/${orderId}`, updateData);
    return response.data;
  } catch (error) {
    console.error('Update order error:', error.response?.data || error.message);
    
    if (error.response?.data?.locked) {
      throw new Error('This design is locked and cannot be edited');
    }
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

export const lockOrder = async (orderId, isLocked) => {
  try {
    console.log(`🔒 ${isLocked ? 'Locking' : 'Unlocking'} order ${orderId}`);
    const response = await api.patch(`/orders/${orderId}/lock`, { 
      isLocked: Boolean(isLocked) 
    });
    return response.data;
  } catch (error) {
    console.error('Lock order error:', error.response?.data || error.message);
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

// ============================================
// MESSAGING APIs
// ============================================

export const sendMessage = async (messageData) => {
  try {
    console.log('💬 Sending message:', messageData);
    const response = await api.post('/messages', {
      receiverId: messageData.receiverId,
      content: messageData.content,
      orderId: messageData.orderId || null
    });
    return response.data;
  } catch (error) {
    console.error("Send message error:", error.response?.data || error.message);
    throw error;
  }
};

export const getConversation = async (userId) => {
  try {
    if (!userId) throw new Error('User ID is missing!');
    const response = await api.get(`/messages/conversations/${userId}`);
    return response.data;
  } catch (error) {
    console.error("Get conversation error:", error.response?.data || error.message);
    throw error;
  }
};

export const getAllConversations = async () => {
  try {
    const response = await api.get('/messages/conversations');
    return response.data;
  } catch (error) {
    console.error("Get all conversations error:", error.response?.data || error.message);
    throw error;
  }
};

export const markConversationAsRead = async (conversationId) => {
  try {
    const response = await api.patch(`/messages/conversations/${conversationId}/read`);
    return response.data;
  } catch (error) {
    console.error("Mark conversation as read error:", error.response?.data || error.message);
    throw error;
  }
};

export const getUnreadCount = async () => {
  const response = await api.get('/messages/unread');
  return response.data;
};

// ============================================
// ADMIN APIs
// ============================================

export const getDashboardStats = async (timestamp) => {
  try {
    const queryParam = timestamp ? `?t=${timestamp}` : '';
    const response = await api.get(`/admin/dashboard${queryParam}`);
    return response.data;
  } catch (error) {
    console.error('Get dashboard stats error:', error.response?.data || error.message);
    throw error;
  }
};

export const getDiagnosticData = async () => {
  try {
    const response = await api.get('/admin/diagnostic');
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

// ============================================
// REVIEW APIs - ADD THESE TO YOUR api.js FILE
// Add these at the bottom, before "export default api;"
// ============================================
 

export const getTailorById = async (tailorId) => {
  try {
    console.log('👤 Fetching tailor details for:', tailorId);
    const response = await api.get(`/customers/tailors/${tailorId}`);
    console.log('✅ Tailor details fetched successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Get tailor by ID error:', error.response?.data || error.message);
    throw error;
  }
};
// ADD THESE FUNCTIONS TO: tailor-smart-mob-app/src/services/api.js 

// Update the existing createReview function:
export const createReview = async (reviewData) => {
  try {
    console.log('⭐ Creating review:', reviewData);
    
    // Validate rating
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    const response = await api.post('/reviews', reviewData);
    console.log('✅ Review created successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Create review error:', error.response?.data || error.message);
    throw error;
  }
};

// Update the existing getTailorReviews function:
export const getTailorReviews = async (tailorId) => {
  try {
    console.log('📊 Fetching reviews for tailor:', tailorId);
    const response = await api.get(`/reviews/tailor/${tailorId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Get tailor reviews error:', error.response?.data || error.message);
    throw error;
  }
};

// These should already exist, but here they are for reference:
export const checkReviewEligibility = async (orderId) => {
  try {
    console.log('🔍 Checking review eligibility for order:', orderId);
    const response = await api.get(`/reviews/check-eligibility/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Check review eligibility error:', error.response?.data || error.message);
    throw error;
  }
};

export const getMyReviews = async () => {
  try {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  } catch (error) {
    console.error('❌ Get my reviews error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteReview = async (reviewId) => {
  try {
    console.log('🗑️ Deleting review:', reviewId);
    const response = await api.delete(`/reviews/${reviewId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Delete review error:', error.response?.data || error.message);
    throw error;
  }
};
export default api;