import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, register, verifyOtp, updateProfile as updateProfileAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState(null);
  const [user, setUser] = useState(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationUserId, setVerificationUserId] = useState(null);

  const loginUser = async (email, password) => {
    setIsLoading(true);
    try {
      const response = await login(email, password);
      
      // Check if verification is required
      if (response.requiresVerification) {
        setNeedsVerification(true);
        setVerificationUserId(response.userId);
        setIsLoading(false);
        return { success: false, requiresVerification: true, userId: response.userId };
      }
      
      // If login successful, save token and user data
      setUser(response.user);
      setUserToken(response.token);
      
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Login error in AuthContext:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.msg || error.message || 'Something went wrong' 
      };
    }
  };

  const registerUser = async (userData) => {
    setIsLoading(true);
    try {
      console.log('AuthContext register called with:', userData);
      
      // Validate required location fields
      if (!userData.city) {
        throw new Error('City is required');
      }
      
      if (userData.city === 'Islamabad' && !userData.region) {
        throw new Error('Region is required for Islamabad');
      }
      
      const response = await register(userData);
      console.log('Registration response:', response);
      
      // Extract user ID from various possible response structures
      const userId = response.userId || 
                     (response.user && response.user._id) || 
                     (response.user && response.user.id) || 
                     (response.data && response.data.userId) ||
                     response._id ||
                     response.id;
      
      if (!userId) {
        console.error('Response from registration:', response);
        throw new Error('User ID missing in registration response');
      }
      
      // Set verification needed state
      setNeedsVerification(true);
      setVerificationUserId(userId);
      
      setIsLoading(false);
      return { success: true, userId: userId };
    } catch (error) {
      console.error('Registration error in AuthContext:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.msg || error.message || 'Something went wrong' 
      };
    }
  };

  const verifyUser = async (userId, otp) => {
    setIsLoading(true);
    try {
      // Validate inputs
      if (!userId) {
        throw new Error('User ID is required for verification');
      }
      
      if (!otp || otp.length !== 6) {
        throw new Error('Valid 6-digit OTP is required');
      }
      
      console.log('AuthContext verifyUser calling API with:', { userId, otp });
      
      const response = await verifyOtp(userId, otp);
      
      // Check if token and user are present in the response
      if (!response.token || !response.user) {
        throw new Error('Invalid response from verification API');
      }
      
      // Store user data and token
      setUser(response.user);
      setUserToken(response.token);
      setNeedsVerification(false);
      setVerificationUserId(null);
      
      await AsyncStorage.setItem('userToken', response.token);
      await AsyncStorage.setItem('user', JSON.stringify(response.user));
      
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Verification error in AuthContext:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.msg || error.message || 'Invalid OTP' 
      };
    }
  };

  // NEW: Enhanced profile update function
  const updateProfile = async (profileData) => {
    setIsLoading(true);
    try {
      console.log('AuthContext updateProfile called with:', profileData);
      
      // Validate location if provided
      if (profileData.city) {
        if (profileData.city === 'Islamabad' && !profileData.region) {
          throw new Error('Region is required for Islamabad');
        }
        if (profileData.city !== 'Islamabad' && profileData.region) {
          // Clear region for non-Islamabad cities
          profileData.region = null;
        }
      }
      
      const response = await updateProfileAPI(profileData);
      
      if (response.success && response.user) {
        // Update local user state
        setUser(response.user);
        
        // Update stored user data
        await AsyncStorage.setItem('user', JSON.stringify(response.user));
        
        setIsLoading(false);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.msg || 'Profile update failed');
      }
    } catch (error) {
      console.error('Profile update error in AuthContext:', error);
      setIsLoading(false);
      return { 
        success: false, 
        error: error.response?.data?.msg || error.message || 'Failed to update profile' 
      };
    }
  };

  const logoutUser = async () => {
    setIsLoading(true);
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('user');
      setUserToken(null);
      setUser(null);
      setNeedsVerification(false);
      setVerificationUserId(null);
      setIsLoading(false);
      return { success: true };
    } catch (error) {
      console.error('Logout error in AuthContext:', error);
      setIsLoading(false);
      return { success: false, error: error.message };
    }
  };

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      
      // Load token and user data from storage
      const token = await AsyncStorage.getItem('userToken');
      const userData = await AsyncStorage.getItem('user');
      
      if (token && userData) {
        const parsedUserData = JSON.parse(userData);
        setUserToken(token);
        setUser(parsedUserData);
      }
      
      setIsLoading(false);
    } catch (error) {
      console.log('Error checking login state:', error);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        userToken,
        user,
        setUserToken,
        setUser,
        needsVerification,
        verificationUserId,
        login: loginUser,
        register: registerUser,
        logout: logoutUser,
        verifyOtp: verifyUser,
        updateProfile,  // NEW: Include the update profile function
        isLoggedIn
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};