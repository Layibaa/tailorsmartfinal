import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { login, register, getCurrentUser, logout as apiLogout } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStoredData = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        
        if (storedToken) {
          setToken(storedToken);
          const userData = await getCurrentUser(storedToken);
          setUser(userData);
        }
      } catch (err) {
        console.error('Failed to load auth data', err);
      } finally {
        setLoading(false);
      }
    };

    loadStoredData();
  }, []);

  const signIn = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const { token, user } = await login(email, password);
      await AsyncStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to sign in');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const { token, user } = await register(userData);
      await AsyncStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      return { success: true };
    } catch (err) {
      setError(err.message || 'Failed to sign up');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      // Even if the API call fails, we want to log out the user locally
      if (token) {
        try {
          await apiLogout(token);
        } catch (err) {
          console.log('API logout failed, still proceeding with local logout', err);
        }
      }
      
      // Clear all auth-related data from AsyncStorage
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Clear state
      setToken(null);
      setUser(null);
      
      console.log('Logout successful');
    } catch (err) {
      console.error('Failed to logout', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserData = (newUserData) => {
    setUser(prev => ({ ...prev, ...newUserData }));
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      error,
      signIn,
      signUp,
      logout,
      updateUserData,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
