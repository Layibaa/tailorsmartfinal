import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthContext } from '../contexts/AuthContext';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import CustomerSignupScreen from '../screens/CustomerSignupScreen';
import TailorSignupScreen from '../screens/TailorSignupScreen';
import OtpVerificationScreen from '../screens/OtpVerificationScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';

// App Screens
import HomeScreen from '../screens/HomeScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import Loading from '../components/Loading';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const { isLoading, userToken, userData } = useContext(AuthContext);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {userToken ? (
        // User is logged in
        userData?.role === 'admin' ? (
          // Admin routes
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        ) : (
          // Customer/Tailor routes
          <Stack.Screen name="Home" component={HomeScreen} />
        )
      ) : (
        // Auth routes
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          <Stack.Screen name="CustomerSignup" component={CustomerSignupScreen} />
          <Stack.Screen name="TailorSignup" component={TailorSignupScreen} />
          <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
