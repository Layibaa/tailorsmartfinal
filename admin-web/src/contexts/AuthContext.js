// admin-web/src/contexts/AuthContext.js - Complete fixed version
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
  const [initialized, setInitialized] = useState(false);

  // Check auth on app start
  useEffect(() => {
    const checkAuth = async () => {
      console.log('AuthContext: Initializing authentication check...');
      setLoading(true);
      
      const token = localStorage.getItem('adminToken');
      console.log('AuthContext: Token found:', !!token);
      
      if (token) {
        try {
          console.log('AuthContext: Verifying token with server...');
          const response = await auth.whoami();
          console.log('AuthContext: Token verification response:', response.data);
          
          if (response.data && response.data.user) {
            const userData = response.data.user;
            
            // Check if user has admin privileges
            const adminRoles = ['admin', 'superadmin', 'support'];
            if (adminRoles.includes(userData.role)) {
              console.log('AuthContext: Valid admin user found, setting user state');
              setUser(userData);
            } else {
              console.warn('AuthContext: User does not have admin privileges:', userData.role);
              localStorage.removeItem('adminToken');
              localStorage.removeItem('adminRefreshToken');
              setUser(null);
            }
          } else {
            console.error('AuthContext: Invalid response format from whoami');
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminRefreshToken');
            setUser(null);
          }
        } catch (error) {
          console.error('AuthContext: Token verification failed:', error);
          
          // Only clear tokens if it's an auth error, not a network error
          if (error.isAuthError || error.status === 401) {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminRefreshToken');
          }
          
          setUser(null);
        }
      } else {
        console.log('AuthContext: No token found, user not authenticated');
        setUser(null);
      }
      
      setLoading(false);
      setInitialized(true);
      console.log('AuthContext: Authentication check completed');
    };
    
    if (!initialized) {
      checkAuth();
    }
  }, [initialized]);

  const login = async (email, password) => {
    console.log('AuthContext: Login attempt for:', email);
    
    try {
      console.log('AuthContext: Calling API login...');
      const response = await auth.login(email, password);
      console.log('AuthContext: API login response received');
      
      // Validate response structure
      if (!response.success || !response.user) {
        throw new Error('Invalid login response from server');
      }
      
      // Check if user has admin privileges
      const adminRoles = ['admin', 'superadmin', 'support'];
      if (!adminRoles.includes(response.user.role)) {
        console.error('AuthContext: User role not authorized:', response.user.role);
        
        // Clear any stored tokens for non-admin users
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        
        return { 
          success: false, 
          error: 'Access denied. Admin privileges required.' 
        };
      }
      
      console.log('AuthContext: Valid admin login, setting user state');
      setUser(response.user);
      
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      
      // Clear any potentially stored tokens on login failure
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminRefreshToken');
      
      let errorMessage = 'Login failed';
      
      if (error.isNetworkError) {
        errorMessage = 'Server connection failed. Please check if the server is running.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.status === 401) {
        errorMessage = 'Invalid email or password';
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    console.log('AuthContext: Logout initiated');
    setLoading(true);
    
    try {
      const result = await auth.logout();
      setUser(null);
      console.log('AuthContext: Logout completed successfully');
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Logout error (non-critical):', error);
      // Even if logout fails on server, we clear local state
      setUser(null);
      return { success: true }; // Always return success for logout
    } finally {
      setLoading(false);
    }
  };

  // Refresh user data (useful after updates)
  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const response = await auth.whoami();
      if (response.data && response.data.user) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('AuthContext: User refresh failed:', error);
    }
  };

  console.log('AuthContext: Current state - user:', !!user, 'loading:', loading, 'initialized:', initialized);

  const contextValue = {
    user,
    login,
    logout,
    refreshUser,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isSuperAdmin: user?.role === 'superadmin',
    isSupport: user?.role === 'support'
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};