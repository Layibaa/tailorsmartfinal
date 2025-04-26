import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  login, 
  adminLogin as apiAdminLogin, 
  verifyOtp as apiVerifyOtp, 
  resetPassword as apiResetPassword,
  forgotPassword as apiForgotPassword
} from '../api/authApi';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState(null);

  // Check for stored token on app startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const storedUserData = await AsyncStorage.getItem('userData');
        
        if (token && storedUserData) {
          setUserToken(token);
          setUserData(JSON.parse(storedUserData));
        }
      } catch (e) {
        console.error('Failed to load authentication token and data', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Login function
  const loginUser = async (email, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await login(email, password);
      
      setUserToken(response.token);
      setUserData({
        ...response.user,
        role: response.user.shopName ? 'tailor' : 'customer' // Determine role based on data
      });
      
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('userData', JSON.stringify({
        ...response.user,
        role: response.user.shopName ? 'tailor' : 'customer'
      }));
      
      return { success: true, data: {
        ...response.user,
        role: response.user.shopName ? 'tailor' : 'customer'
      }};
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Admin login function
  const loginAdmin = async (username, password) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiAdminLogin(username, password);
      
      setUserToken(response.token);
      setUserData({
        ...response.user,
        role: 'admin'
      });
      
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('userData', JSON.stringify({
        ...response.user,
        role: 'admin'
      }));
      
      return { success: true, data: {
        ...response.user,
        role: 'admin'
      }};
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Admin login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP function
  const verifyUserOtp = async (email, otp) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiVerifyOtp(email, otp);
      
      // Determine role based on user data from response
      const role = response.user.shopName ? 'tailor' : 'customer';
      
      setUserToken(response.token);
      setUserData({
        ...response.user,
        role
      });
      
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('userData', JSON.stringify({
        ...response.user,
        role
      }));
      
      return { 
        success: true, 
        data: {
          ...response.user,
          role
        }
      };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'OTP verification failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Forgot password function
  const forgotUserPassword = async (email) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiForgotPassword(email);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Failed to send recovery email. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Reset password function
  const resetUserPassword = async (email, otp, newPassword) => {
    setIsLoading(true);
    setError(null);
    
    try {
      await apiResetPassword(email, otp, newPassword);
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password reset failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    setIsLoading(true);
    
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUserToken(null);
      setUserData(null);
    } catch (e) {
      console.error('Failed to remove auth data from storage', e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        userData,
        error,
        loginUser,
        loginAdmin,
        verifyUserOtp,
        forgotUserPassword,
        resetUserPassword,
        logout,
        setError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};