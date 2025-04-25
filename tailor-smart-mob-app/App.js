import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Import screens
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import TailorListScreen from './screens/TailorListScreen';
import TailorDetailScreen from './screens/TailorDetailScreen';
import ProfileScreen from './screens/ProfileScreen';
import OrderListScreen from './screens/OrderListScreen';
import NewOrderScreen from './screens/NewOrderScreen';
import OrderDetailScreen from './screens/OrderDetailScreen';
import ChatListScreen from './screens/ChatListScreen';
import ChatScreen from './screens/ChatScreen';
import NotificationsScreen from './screens/NotificationsScreen';

// Create navigation stacks
const MainStack = createStackNavigator();
const AuthStack = createStackNavigator();

const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
};

const MainStackNavigator = () => {
  return (
    <MainStack.Navigator>
      <MainStack.Screen name="Home" component={HomeScreen} options={{ title: 'TailorSmart' }} />
      <MainStack.Screen name="TailorList" component={TailorListScreen} options={{ title: 'Find Tailors' }} />
      <MainStack.Screen name="TailorDetail" component={TailorDetailScreen} options={{ title: 'Tailor Profile' }} />
      <MainStack.Screen name="Profile" component={ProfileScreen} options={{ title: 'My Profile' }} />
      <MainStack.Screen name="OrderList" component={OrderListScreen} options={{ title: 'My Orders' }} />
      <MainStack.Screen name="NewOrder" component={NewOrderScreen} options={{ title: 'New Order' }} />
      <MainStack.Screen name="OrderDetail" component={OrderDetailScreen} options={{ title: 'Order Details' }} />
      <MainStack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Messages' }} />
      <MainStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
      <MainStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
    </MainStack.Navigator>
  );
};

// Create a minimal LoadingScreen component
const LoadingScreen = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.loadingText}>Loading TailorSmart...</Text>
  </View>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Simulate checking authentication status
  useEffect(() => {
    const checkAuth = async () => {
      // For demo purposes, we're just simulating a check
      // In a real app, you would check AsyncStorage or SecureStore
      setTimeout(() => {
        setIsLoading(false);
        // For demo, start with authentication false
        setIsAuthenticated(false);
      }, 1500);
    };
    
    checkAuth();
  }, []);
  
  if (isLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <LoadingScreen />
      </SafeAreaProvider>
    );
  }
  
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        {isAuthenticated ? <MainStackNavigator /> : <AuthStackNavigator />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
  },
  loadingText: {
    fontSize: 18,
    color: '#4A90E2',
    fontWeight: 'bold',
  },
});
