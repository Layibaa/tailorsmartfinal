import React, { createContext, useState, useEffect } from 'react';

// Create context
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    token: null,
    user: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    // Simulate checking auth state
    setTimeout(() => {
      setAuthState({
        token: null,
        user: null,
        isLoading: false,
        error: null
      });
    }, 500);
  }, []);

  // Login (simplified for testing)
  const login = async (email, password) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response for testing
      const mockResponse = {
        token: 'mock-token-123',
        user: {
          id: '1',
          name: 'Test User',
          email: email,
          role: 'customer'
        }
      };
      
      // Update auth state
      setAuthState({
        token: mockResponse.token,
        user: mockResponse.user,
        isLoading: false,
        error: null,
      });
      
      return mockResponse;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Login failed',
      }));
      throw error;
    }
  };

  // Register (simplified for testing)
  const register = async (userData) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock response for testing
      const mockResponse = {
        token: 'mock-token-123',
        user: {
          id: '1',
          name: userData.name,
          email: userData.email,
          role: userData.role || 'customer'
        }
      };
      
      // Update auth state
      setAuthState({
        token: mockResponse.token,
        user: mockResponse.user,
        isLoading: false,
        error: null,
      });
      
      return mockResponse;
    } catch (error) {
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Registration failed',
      }));
      throw error;
    }
  };

  // Logout
  const logout = () => {
    // Reset auth state
    setAuthState({
      token: null,
      user: null,
      isLoading: false,
      error: null,
    });
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
