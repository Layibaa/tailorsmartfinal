import React, { useContext } from 'react';
import { AuthContext } from '../services/auth';
import { AuthNavigator } from './AuthNavigator';
import { DrawerNavigator } from './DrawerNavigator';
import Loading from '../components/Loading';

export const AppNavigator = () => {
  const { authState } = useContext(AuthContext);
  
  // Show loading screen while checking authentication
  if (authState.isLoading) {
    return <Loading />;
  }

  // Render auth screens or main app based on authentication state
  return authState.token ? <DrawerNavigator /> : <AuthNavigator />;
};
