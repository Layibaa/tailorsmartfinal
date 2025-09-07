// admin-web/src/contexts/AuthContext.js - Simple auth context
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
      const token = localStorage.getItem('adminToken');
      if (token) {
        try {
          const response = await auth.whoami();
          if (response.data.user.role === 'admin' || response.data.user.role === 'superadmin') {
            setUser(response.data.user);
          } else {
            // Not an admin, clear tokens
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminRefreshToken');
          }
        } catch (error) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminRefreshToken');
        }
      }
      setLoading(false);
    };
    
    checkAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await auth.login(email, password);
      
      // Check if user is admin
      if (!['admin', 'superadmin', 'support'].includes(response.user.role)) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      setUser(response.user);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.msg || error.message 
      };
    }
  };

  const logout = async () => {
    try {
      await auth.logout();
      setUser(null);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};