// admin-web/src/contexts/AuthContext.js - Enhanced with debugging
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth on app start
  useEffect(() => {
    const checkAuth = async () => {
      console.log('AuthContext: Checking authentication...');
      const token = localStorage.getItem('adminToken');
      console.log('AuthContext: Token found:', !!token);
      
      if (token) {
        try {
          console.log('AuthContext: Verifying token with server...');
          const response = await auth.whoami();
          console.log('AuthContext: Server response:', response.data);
          
          if (response.data.user.role === 'admin' || response.data.user.role === 'superadmin') {
            console.log('AuthContext: Valid admin user, setting user state');
            setUser(response.data.user);
          } else {
            console.log('AuthContext: User is not admin, clearing tokens');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminRefreshToken');
          }
        } catch (error) {
          console.error('AuthContext: Token verification failed:', error);
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
        }
      } else {
        console.log('AuthContext: No token found');
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email, password) => {
    console.log('AuthContext: Login attempt for:', email);
    
    try {
      console.log('AuthContext: Calling API login...');
      const response = await auth.login(email, password);
      console.log('AuthContext: API login response:', response);
      
      // Check if user is admin
      if (!['admin', 'superadmin', 'support'].includes(response.user.role)) {
        console.error('AuthContext: User role not authorized:', response.user.role);
        throw new Error('Access denied. Admin privileges required.');
      }
      
      console.log('AuthContext: Login successful, setting user state');
      setUser(response.user);
      
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      const errorMsg = error.response?.data?.msg || error.message || 'Login failed';
      return { 
        success: false, 
        error: errorMsg
      };
    }
  };

  const logout = async () => {
    console.log('AuthContext: Logout called');
    try {
      await auth.logout();
      setUser(null);
      console.log('AuthContext: Logout successful');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  console.log('AuthContext: Current state - user:', !!user, 'loading:', loading);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};