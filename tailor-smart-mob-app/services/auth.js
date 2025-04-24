import React, { createContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { loginUser, registerUser, getCurrentUser } from './api';

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    isLoading: true,
    error: null,
  });

  // Check if user is already logged in
  useEffect(() => {
    const loadToken = async () => {
      try {
        // Get token from secure storage
        const token = await SecureStore.getItemAsync('token');
        
        if (token) {
          // If token exists, fetch current user data
          const userData = await getCurrentUser();
          
          setAuthState({
            token,
            user: userData,
            isLoading: false,
            error: null,
          });
        } else {
          // No token found
          setAuthState({
            token: null,
            user: null,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        // Clear token if there was an error (it might be expired)
        await SecureStore.deleteItemAsync('token');
        setAuthState({
          token: null,
          user: null,
          isLoading: false,
          error: error.message,
        });
      }
    };

    loadToken();
  }, []);

  // Login
  const login = async (email, password) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Call login API
      const response = await loginUser(email, password);
      
      // Store token in secure storage
      await SecureStore.setItemAsync('token', response.token);
      
      // Update auth state
      setAuthState({
        token: response.token,
        user: response.user,
        isLoading: false,
        error: null,
      });
      
      return response;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  // Register
  const register = async (userData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Call register API
      const response = await registerUser(userData);
      
      // Store token in secure storage
      await SecureStore.setItemAsync('token', response.token);
      
      // Update auth state
      setAuthState({
        token: response.token,
        user: response.user,
        isLoading: false,
        error: null,
      });
      
      return response;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      // Clear token from secure storage
      await SecureStore.deleteItemAsync('token');
      
      // Reset auth state
      setAuthState({
        token: null,
        user: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Update user in state (after profile updates)
  const updateUser = (userData) => {
    setAuthState(prev => ({
      ...prev,
      user: { ...prev.user, ...userData },
    }));
  };

  // Provide auth context to app
  return (
    <AuthContext.Provider
      value={{
        authState,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
