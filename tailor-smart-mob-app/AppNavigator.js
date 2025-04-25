import React, { useContext, useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

// Screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import OTPVerificationScreen from './screens/OTPVerificationScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import ResetPasswordScreen from './screens/ResetPasswordScreen';
import CustomerDashboard from './screens/CustomerDashboard';
import TailorDashboard from './screens/TailorDashboard';
import AdminDashboard from './screens/AdminDashboard';

// Context
import { AuthContext } from './utils/authContext';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { authState, dispatch } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the user is already logged in
    const bootstrapAsync = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');
        
        if (userToken && userData) {
          const user = JSON.parse(userData);
          dispatch({ type: 'RESTORE_TOKEN', token: userToken, user });
        }
      } catch (e) {
        console.log('Failed to load token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, [dispatch]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066CC" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {authState.userToken === null ? (
          // Auth screens
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          </>
        ) : (
          // Role-based dashboard screens
          <>
            {authState.userRole === 'customer' && (
              <Stack.Screen name="CustomerDashboard" component={CustomerDashboard} />
            )}
            {authState.userRole === 'tailor' && (
              <Stack.Screen name="TailorDashboard" component={TailorDashboard} />
            )}
            {authState.userRole === 'admin' && (
              <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
            )}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default AppNavigator;
