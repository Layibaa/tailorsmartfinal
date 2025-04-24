import React, { useContext } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerItem } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { TabNavigator } from './TabNavigator';
import SettingsScreen from '../screens/SettingsScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import { AuthContext } from '../services/auth';
import { theme } from '../utils/theme';
import { SvgXml } from 'react-native-svg';
import { logoSvg } from '../assets/logo.svg';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props) => {
  const { authState, logout } = useContext(AuthContext);
  const user = authState.user || {};
  
  return (
    <DrawerContentScrollView {...props}>
      <View style={styles.drawerHeader}>
        <SvgXml xml={logoSvg} width={160} height={40} />
      </View>
      
      <View style={styles.userInfo}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user.name ? user.name.charAt(0).toUpperCase() : '?'}
          </Text>
        </View>
        <Text style={styles.userName}>{user.name || 'User'}</Text>
        <Text style={styles.userRole}>{user.role || 'Role'}</Text>
      </View>
      
      <DrawerItemList {...props} />
      
      <DrawerItem
        label="Logout"
        icon={({ color, size }) => (
          <Ionicons name="log-out-outline" color={color} size={size} />
        )}
        onPress={logout}
        labelStyle={styles.drawerItemLabel}
      />
    </DrawerContentScrollView>
  );
};

export const DrawerNavigator = () => {
  const { authState } = useContext(AuthContext);
  const isAdmin = authState.user?.role === 'admin';
  
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerActiveTintColor: theme.colors.primary,
        drawerInactiveTintColor: theme.colors.text,
        drawerLabelStyle: styles.drawerItemLabel,
      }}
      drawerContent={props => <CustomDrawerContent {...props} />}
    >
      <Drawer.Screen
        name="Home"
        component={TabNavigator}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Drawer.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" color={color} size={size} />
          ),
        }}
      />
      
      <Drawer.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          drawerIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" color={color} size={size} />
          ),
        }}
      />
      
      {isAdmin && (
        <Drawer.Screen
          name="Admin Dashboard"
          component={AdminDashboardScreen}
          options={{
            drawerIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" color={color} size={size} />
            ),
          }}
        />
      )}
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerHeader: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  userInfo: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginBottom: 8,
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    color: theme.colors.white,
    fontFamily: 'Poppins-Bold',
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  userRole: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  drawerItemLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
});