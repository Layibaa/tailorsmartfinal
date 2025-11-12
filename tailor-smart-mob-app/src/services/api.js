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
  try {
    const response = await api.get(`/tailors/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Get tailor order details error:', error.response?.data || error.message);
    throw error;
  }
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
 

export const deleteOrder = async (orderId) => {
  try {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Delete order error:', error.response?.data || error.message);
    throw error;
  }
};

export const getCustomerOrders = async () => {
  const response = await api.get('/customers/orders');
  return response.data;
};

export const updateOrderStatus = async (orderId, statusData) => {
  try {
    console.log('\n📡 ================================');
    console.log('📡 API: updateOrderStatus called');
    console.log('📡 Order ID:', orderId);
    console.log('📡 Order ID Type:', typeof orderId);
    console.log('📡 Status Data:', JSON.stringify(statusData, null, 2));
    console.log('📡 ================================\n');
    
    // Validate inputs
    if (!orderId) {
      throw new Error('Order ID is required');
    }
    
    if (!statusData || !statusData.status) {
      throw new Error('Status data is required');
    }
    
    // Construct the URL
    const url = `/orders/${orderId}/status`;
    console.log('📍 Request URL:', url);
    console.log('📦 Request Body:', JSON.stringify(statusData, null, 2));
    
    // Make the request
    console.log('⏳ Sending PATCH request...');
    const response = await api.patch(url, statusData);
    
    console.log('\n✅ ================================');
    console.log('✅ API Response received');
    console.log('✅ Status:', response.status);
    console.log('✅ Data:', JSON.stringify(response.data, null, 2));
    console.log('✅ ================================\n');
    
    return response.data;
    
  } catch (error) {
    console.error('\n❌ ================================');
    console.error('❌ API Error in updateOrderStatus');
    console.error('❌ Order ID:', orderId);
    console.error('❌ Status Data:', statusData);
    console.error('❌ Error Message:', error.message);
    
    if (error.response) {
      console.error('❌ Response Status:', error.response.status);
      console.error('❌ Response Headers:', JSON.stringify(error.response.headers, null, 2));
      console.error('❌ Response Data:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('❌ No response received');
      console.error('❌ Request:', error.request);
    } else {
      console.error('❌ Error setting up request:', error.message);
    }
    
    console.error('❌ ================================\n');
    
    throw error;
  }
};

export const confirmOrder = async (orderId) => {
  const response = await api.patch(`/orders/${orderId}/confirm`, {});
  return response.data;
};
 

export const getCustomerOrderDetails = async (orderId) => {
  try {
    const response = await api.get(`/customers/orders/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('Get customer order details error:', error.response?.data || error.message);
    throw error;
  }
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
 

// ADD THESE FUNCTIONS TO: tailor-smart-mob-app/src/services/api.js
// Place these in the REVIEW APIs section (replace existing review functions)

// ============================================
// REVIEW APIs - GENERAL TAILOR REVIEWS
// ============================================

// Create a general review for a tailor (not tied to order)
export const createGeneralReview = async (tailorId, reviewData) => {
  try {
    console.log('⭐ Creating general review for tailor:', tailorId, reviewData);
    
    // Validate rating
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Validate comment
    if (!reviewData.comment || reviewData.comment.trim().length < 10) {
      throw new Error('Comment must be at least 10 characters');
    }
    
    const response = await api.post(`/reviews/tailor/${tailorId}`, reviewData);
    console.log('✅ General review created successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Create general review error:', error.response?.data || error.message);
    throw error;
  }
};
 

// Check if customer can review this tailor (general review)
export const checkTailorReviewEligibility = async (tailorId) => {
  try {
    console.log('🔍 Checking review eligibility for tailor:', tailorId);
    const response = await api.get(`/reviews/check-eligibility/tailor/${tailorId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Check review eligibility error:', error.response?.data || error.message);
    throw error;
  }
};
 

// Add these functions at the bottom before export default api

// ============================================
// ADMIN BROADCAST APIs
// ============================================

export const getUserAdminMessages = async () => {
  try {
    console.log('📨 Fetching admin messages');
    const response = await api.get('/admin-messages/my-messages');
    return response.data;
  } catch (error) {
    console.error('Get admin messages error:', error);
    throw error;
  }
};

export const getUnreadAdminMessagesCount = async () => {
  try {
    const response = await api.get('/admin-messages/my-messages/unread-count');
    return response.data;
  } catch (error) {
    console.error('Get unread admin messages count error:', error);
    throw error;
  }
};

export const markMessageAsRead = async (messageId) => {
  try {
    console.log('✅ Marking message as read:', messageId);
    const response = await api.patch(`/admin-messages/my-messages/${messageId}/read`);
    return response.data;
  } catch (error) {
    console.error('Mark message as read error:', error);
    throw error;
  }
};
export const requestPriceNegotiation = async (orderId) => {
  try {
    console.log('💬 Requesting price negotiation for order:', orderId);
    const response = await api.post(`/orders/${orderId}/negotiate-price`);
    console.log('✅ Price negotiation requested successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Request price negotiation error:', error.response?.data || error.message);
    throw error;
  }
};

// Tailor updates price (one-time only)
export const updateOrderPrice = async (orderId, newPrice) => {
  try {
    console.log('💰 Updating order price:', { orderId, newPrice });
    
    if (!newPrice || newPrice <= 0) {
      throw new Error('Valid price is required');
    }
    
    const response = await api.patch(`/orders/${orderId}/update-price`, {
      price: parseFloat(newPrice)
    });
    
    console.log('✅ Price updated successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Update price error:', error.response?.data || error.message);
    throw error;
  }
};

// Create review for a completed order
export const createOrderReview = async (orderId, reviewData) => {
  try {
    console.log('⭐ Creating review for order:', orderId, reviewData);
    
    // Validate rating
    if (!reviewData.rating || reviewData.rating < 1 || reviewData.rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }
    
    // Validate comment
    if (!reviewData.comment || reviewData.comment.trim().length < 10) {
      throw new Error('Comment must be at least 10 characters');
    }
    
    const response = await api.post(`/reviews/order/${orderId}`, reviewData);
    console.log('✅ Review created successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Create order review error:', error.response?.data || error.message);
    throw error;
  }
};

// Check if order can be reviewed
export const checkOrderReviewEligibility = async (orderId) => {
  try {
    console.log('🔍 Checking review eligibility for order:', orderId);
    const response = await api.get(`/reviews/check-eligibility/order/${orderId}`);
    return response.data;
  } catch (error) {
    console.error('❌ Check order review eligibility error:', error.response?.data || error.message);
    throw error;
  }
};

// Get all reviews for a tailor (public - no auth needed)
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

// Get customer's own reviews
export const getMyReviews = async () => {
  try {
    const response = await api.get('/reviews/my-reviews');
    return response.data;
  } catch (error) {
    console.error('❌ Get my reviews error:', error.response?.data || error.message);
    throw error;
  }
};

// Update existing review
export const updateReview = async (reviewId, reviewData) => {
  try {
    console.log('📝 Updating review:', reviewId);
    const response = await api.put(`/reviews/${reviewId}`, reviewData);
    return response.data;
  } catch (error) {
    console.error('❌ Update review error:', error.response?.data || error.message);
    throw error;
  }
};

// Delete review
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

// Add these to the PASSWORD MANAGEMENT section:

export const sendPasswordChangeOtp = async () => {
  try {
    console.log('📤 Sending password change OTP...');
    const response = await api.post('/customers/password/send-otp');
    console.log('✅ Password OTP sent');
    return response.data;
  } catch (error) {
    console.error('❌ Send password OTP error:', error.response?.data || error.message);
    throw error;
  }
};

export const updatePassword = async (passwordData) => {
  try {
    console.log('🔐 Updating password...');
    const response = await api.put('/customers/password', passwordData);
    console.log('✅ Password updated');
    return response.data;
  } catch (error) {
    console.error('❌ Update password error:', error.response?.data || error.message);
    throw error;
  }
};

export const sendDeleteAccountOtp = async () => {
  try {
    console.log('📤 Sending delete account OTP...');
    const response = await api.post('/customers/delete/send-otp');
    console.log('✅ Delete account OTP sent');
    return response.data;
  } catch (error) {
    console.error('❌ Send delete OTP error:', error.response?.data || error.message);
    throw error;
  }
};

export const deleteAccount = async (otpData) => {
  try {
    console.log('🗑️ Deleting account...');
    const response = await api.delete('/customers/delete', { data: otpData });
    console.log('✅ Account deleted');
    return response.data;
  } catch (error) {
    console.error('❌ Delete account error:', error.response?.data || error.message);
    throw error;
  }
};
export default api;