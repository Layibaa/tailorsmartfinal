import React, { createContext, useReducer } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initial state
const initialState = {
  isLoading: true,
  userToken: null,
  userRole: null,
  userData: null,
  authError: null,
};

// Create context
export const AuthContext = createContext();

// Reducer function to handle state updates
const authReducer = (state, action) => {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return {
        ...state,
        userToken: action.token,
        userRole: action.user?.role,
        userData: action.user,
        isLoading: false,
      };
    case 'LOGIN':
      return {
        ...state,
        userToken: action.token,
        userRole: action.user?.role,
        userData: action.user,
        authError: null,
      };
    case 'LOGOUT':
      return {
        ...state,
        userToken: null,
        userRole: null,
        userData: null,
        authError: null,
      };
    case 'AUTH_ERROR':
      return {
        ...state,
        authError: action.error,
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        authError: null,
      };
    default:
      return state;
  }
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [authState, dispatch] = useReducer(authReducer, initialState);

  // Authentication actions
  const authActions = {
    login: async (token, user) => {
      try {
        await AsyncStorage.setItem('userToken', token);
        await AsyncStorage.setItem('userData', JSON.stringify(user));
        dispatch({ type: 'LOGIN', token, user });
      } catch (error) {
        console.error('Error saving auth data:', error);
      }
    },
    logout: async () => {
      try {
        await AsyncStorage.removeItem('userToken');
        await AsyncStorage.removeItem('userData');
        dispatch({ type: 'LOGOUT' });
      } catch (error) {
        console.error('Error clearing auth data:', error);
      }
    },
    setAuthError: (error) => {
      dispatch({ type: 'AUTH_ERROR', error });
    },
    clearError: () => {
      dispatch({ type: 'CLEAR_ERROR' });
    }
  };

  return (
    <AuthContext.Provider value={{ authState, dispatch, ...authActions }}>
      {children}
    </AuthContext.Provider>
  );
};
