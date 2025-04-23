import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Feather } from '@expo/vector-icons';
import OrderListScreen from '../screens/orders/OrderListScreen';
import OrderDetailScreen from '../screens/orders/OrderDetailScreen';
import NewOrderScreen from '../screens/orders/NewOrderScreen';
import EditOrderScreen from '../screens/orders/EditOrderScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import colors from '../utils/colors';

const Tab = createBottomTabNavigator();
const OrdersStack = createStackNavigator();
const ProfileStack = createStackNavigator();

const createOrdersNavigator = () => (
  <OrdersStack.Navigator screenOptions={{ headerShown: false }}>
    <OrdersStack.Screen name="OrdersList" component={OrderListScreen} />
    <OrdersStack.Screen name="OrderDetail" component={OrderDetailScreen} />
    <OrdersStack.Screen name="NewOrder" component={NewOrderScreen} />
    <OrdersStack.Screen name="EditOrder" component={EditOrderScreen} />
  </OrdersStack.Navigator>
);

const createProfileNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
  </ProfileStack.Navigator>
);

const CustomerNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontFamily: 'Poppins_500Medium',
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Orders"
        component={createOrdersNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="clipboard" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={createProfileNavigator}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Feather name="user" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default CustomerNavigator;
