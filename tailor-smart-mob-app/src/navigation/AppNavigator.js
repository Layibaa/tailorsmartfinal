import React, { useContext } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { StyleSheet } from 'react-native';

// Import contexts
import { AuthContext } from '../context/AuthContext';

// Import screens - Authentication
import LoginScreen from '../screens/auth/LoginScreen';
import CustomerSignupScreen from '../screens/auth/CustomerSignupScreen';
import TailorSignupScreen from '../screens/auth/TailorSignupScreen';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Admin screens 
import AdminMessagesScreen from '../screens/shared/AdminMessagesScreen';

// Customer screens
import CustomerDashboard from '../screens/customer/CustomerDashboard';
import TailorListScreen from '../screens/customer/TailorListScreen';
import CreateOrderScreen from '../screens/customer/CreateOrderScreen';
import MeasurementScreen from '../screens/customer/MeasurementScreen';
import OrderHistoryScreen from '../screens/customer/OrderHistoryScreen';
import ProfileScreen from '../screens/customer/CustomerProfileScreen';
import TailorProfileScreenC from '../screens/customer/TailorProfileScreenC'; 
import WriteOrderReviewScreen from '../screens/customer/WriteOrderReviewScreen';


// Tailor screens
import TailorDashboard from '../screens/tailor/TailorDashboard';
import OrderRequestsScreen from '../screens/tailor/OrderRequestsScreen';
import ActiveOrdersScreen from '../screens/tailor/ActiveOrdersScreen';
import TailorProfileScreen from '../screens/tailor/TailorProfileScreen';

// Shared screens
import ChatScreen from '../screens/shared/ChatScreen';
import OrderDetailsScreen from '../screens/shared/OrderDetailsScreen';
import ChatListScreen from '../screens/shared/ChatListScreen';

// Import colors
import colors from '../styles/colors';

// Create navigators
const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Authentication navigator
const AuthStack = () => (
  <Stack.Navigator 
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.white,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        elevation: 3
      },
      headerTintColor: colors.black,
      headerTitleStyle: {
        fontWeight: 'bold'
      }
    }}
  >
    <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
    <Stack.Screen name="CustomerSignup" component={CustomerSignupScreen} options={{ title: 'Customer Signup' }} />
    <Stack.Screen name="TailorSignup" component={TailorSignupScreen} options={{ title: 'Tailor Signup' }} />
    <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} options={{ title: 'Verify OTP' }} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Reset Password' }} />
  </Stack.Navigator>
);

// Customer tab navigator
const CustomerTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = 'home';
        } else if (route.name === 'Tailors') {
          iconName = 'scissors';
        } else if (route.name === 'Orders') {
          iconName = 'shopping-bag';
        } else if (route.name === 'Messages') {
          iconName = 'message-square';
        }

        return <Feather name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.black,
      tabBarInactiveTintColor: colors.gray,
      tabBarStyle: {
        backgroundColor: colors.white,
        borderTopColor: colors.lightGray
      }
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={CustomerDashboard} 
      options={{ 
        headerShown: false,
        title: 'Dashboard' 
      }} 
    />
    <Tab.Screen 
      name="Tailors" 
      component={TailorListScreen}
      options={{ 
        headerShown: false,
        title: 'Find Tailors' 
      }}
    />
    <Tab.Screen 
      name="Orders" 
      component={OrderHistoryScreen}
      options={{ 
        headerShown: false,
        title: 'My Orders' 
      }}
    />
    <Tab.Screen 
      name="Messages" 
      component={ChatListStackNavigator}
      options={{ 
        headerShown: false,
        title: 'Messages' 
      }}
    />
  </Tab.Navigator>
);

// Tailor tab navigator
const TailorTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;

        if (route.name === 'Home') {
          iconName = 'home';
        } else if (route.name === 'Requests') {
          iconName = 'inbox';
        } else if (route.name === 'Active') {
          iconName = 'activity';
        } else if (route.name === 'Messages') {
          iconName = 'message-square';
        }

        return <Feather name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: colors.black,
      tabBarInactiveTintColor: colors.gray,
      tabBarStyle: {
        backgroundColor: colors.white,
        borderTopColor: colors.lightGray
      }
    })}
  >
    <Tab.Screen 
      name="Home" 
      component={TailorDashboard} 
      options={{ 
        headerShown: false,
        title: 'Dashboard' 
      }} 
    />
    <Tab.Screen 
      name="Requests" 
      component={OrderRequestsScreen}
      options={{ 
        headerShown: false,
        title: 'Requests' 
      }}
    />
    <Tab.Screen 
      name="Active" 
      component={ActiveOrdersScreen}
      options={{ 
        headerShown: false,
        title: 'Active Orders' 
      }}
    />
    <Tab.Screen 
      name="Messages" 
      component={ChatListStackNavigator}
      options={{ 
        headerShown: false,
        title: 'Messages' 
      }}
    />
  </Tab.Navigator>
);
 

// Chat list stack navigator (used in tab navigators)
const ChatListStack = createStackNavigator();

const ChatListStackNavigator = () => (
  <ChatListStack.Navigator
    screenOptions={{
      headerStyle: {
        backgroundColor: colors.white,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        elevation: 3
      },
      headerTintColor: colors.black,
      headerTitleStyle: {
        fontWeight: 'bold'
      }
    }}
  >
    <ChatListStack.Screen 
      name="ChatList" 
      component={ChatListScreen} 
      options={{ title: 'Messages' }} 
    />
    <ChatListStack.Screen 
      name="Chat" 
      component={ChatScreen} 
      options={({ route }) => ({ title: route.params?.name || 'Chat' })} 
    />
  </ChatListStack.Navigator>
);

// Customer stack navigator (including tab navigator) 
const CustomerStack = createStackNavigator();
const CustomerStackNavigator = () => (
  <CustomerStack.Navigator
    screenOptions={{
      headerShown: false
    }}
  >
    <CustomerStack.Screen name="CustomerTabs" component={CustomerTabNavigator} />
    <CustomerStack.Screen 
      name="Profile" 
      component={ProfileScreen} 
      options={{ 
        headerShown: false
      }} 
    />
    <CustomerStack.Screen 
      name="TailorProfile" 
      component={TailorProfileScreenC} 
      options={{ 
        headerShown: false
      }} 
    />
    {/* ✅ REPLACED: Order-based review screen */}
    <CustomerStack.Screen 
      name="WriteOrderReview" 
      component={WriteOrderReviewScreen} 
      options={{ 
        headerShown: false
      }} 
    />
    <CustomerStack.Screen 
      name="OrderDetails" 
      component={OrderDetailsScreen} 
      options={{ 
        headerShown: true,
        title: 'Order Details'
      }} 
    />
    <CustomerStack.Screen 
      name="CreateOrder" 
      component={CreateOrderScreen} 
      options={{ 
        headerShown: true,
        title: 'Create Order'
      }} 
    />
    <CustomerStack.Screen 
      name="Measurements" 
      component={MeasurementScreen} 
      options={{ 
        headerShown: true,
        title: 'Enter Measurements'
      }} 
    />
    <CustomerStack.Screen 
      name="Chat" 
      component={ChatScreen} 
      options={({ route }) => ({ 
        headerShown: true,
        title: route.params?.name || 'Chat' 
      })} 
    />
    <CustomerStack.Screen 
      name="AdminMessages" 
      component={AdminMessagesScreen} 
      options={{ 
        headerShown: false
      }} 
    />
  </CustomerStack.Navigator>
);

// Tailor stack navigator (including tab navigator)
const TailorStack = createStackNavigator();
const TailorStackNavigator = () => (
  <TailorStack.Navigator
    screenOptions={{
      headerShown: false
    }}
  >
    <TailorStack.Screen name="TailorTabs" component={TailorTabNavigator} />
    <TailorStack.Screen 
      name="Profile" 
      component={TailorProfileScreen}
      options={{ 
        headerShown: false
      }} 
    />
    <TailorStack.Screen 
      name="OrderDetails" 
      component={OrderDetailsScreen} 
      options={{ 
        headerShown: true,
        title: 'Order Details'
      }} 
    />
    <TailorStack.Screen 
      name="Chat" 
      component={ChatScreen} 
      options={({ route }) => ({ 
        headerShown: true,
        title: route.params?.name || 'Chat' 
      })} 
    />
    <TailorStack.Screen 
  name="AdminMessages" 
  component={AdminMessagesScreen} 
  options={{ 
    headerShown: false
  }} 
/>
  </TailorStack.Navigator>
);

// Main navigator
const AppNavigator = () => {
  const { isLoading, userToken, user, needsVerification, verificationUserId } = useContext(AuthContext);

  if (isLoading) {
    // Return loading screen or splash screen
    return null;
  }

  if (needsVerification) {
    return (
      <Stack.Navigator
        screenOptions={{
          headerShown: false
        }}
      >
        <Stack.Screen 
          name="OtpVerification" 
          component={OtpVerificationScreen} 
          initialParams={{ userId: verificationUserId }}
        />
      </Stack.Navigator>
    );
  }

  if (!userToken) {
    return <AuthStack />;
  }

  if (user.role === 'admin') {
    return <AdminNavigator />;
  } else if (user.role === 'customer') {
    return <CustomerStackNavigator />;
  } else if (user.role === 'tailor') {
    return <TailorStackNavigator />;
  }

  // Default fallback
  return <AuthStack />;
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray
  }
});

export default AppNavigator;