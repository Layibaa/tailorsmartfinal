import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const useApi = (apiFunc) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token, logout } = useAuth();

  const request = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiFunc(token, ...args);
      setData(response);
      return { data: response, success: true };
    } catch (err) {
      setError(err.message || 'An unexpected error occurred');
      
      // Handle authentication errors
      if (err.status === 401) {
        logout();
      }
      
      return { error: err.message, success: false };
    } finally {
      setLoading(false);
    }
  }, [apiFunc, token, logout]);

  return {
    data,
    loading,
    error,
    request,
  };
};

export default useApi;
