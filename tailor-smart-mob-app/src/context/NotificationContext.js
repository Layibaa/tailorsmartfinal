import React, { createContext, useState, useEffect, useContext } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { API_URL } from '../services/api';

export const NotificationContext = createContext();

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const NotificationProvider = ({ children }) => {
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const [socket, setSocket] = useState(null);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [orderUpdates, setOrderUpdates] = useState([]);
  
  const { user, userToken } = useContext(AuthContext);

  // Initialize socket.io connection
  useEffect(() => {
    if (userToken && user) {
      // Connect to the server
      const newSocket = io(API_URL.replace('/api/v1', ''), {
        auth: {
          token: userToken
        }
      });
      
      setSocket(newSocket);
      
      // Join user-specific room
      newSocket.emit('join', user.id);
      
      // Listen for new messages
      newSocket.on('new-message', (data) => {
        // Increase unread count
        setUnreadMessages((prev) => prev + 1);
        
        // Show notification
        schedulePushNotification({
          title: 'New Message',
          body: data.content,
          data: { screen: 'Chat', senderId: data.senderId }
        });
      });
      
      // Listen for order updates
      newSocket.on('order-update', (data) => {
        // Add to order updates
        setOrderUpdates((prev) => [data, ...prev]);
        
        // Show notification
        schedulePushNotification({
          title: 'Order Update',
          body: data.message,
          data: { screen: 'OrderDetails', orderId: data.orderId }
        });
      });
      
      return () => {
        newSocket.disconnect();
      };
    }
  }, [userToken, user]);

  // Register for push notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // Listen for incoming notifications
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // Handle notification taps
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle navigation to specific screens based on notification
      const data = response.notification.request.content.data;
      // Navigation logic would go here
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  // Clear notifications when reading messages
  const clearMessageNotifications = (senderId) => {
    setUnreadMessages(prev => Math.max(0, prev - 1));
  };

  // Clear order update notifications
  const clearOrderNotification = (orderId) => {
    setOrderUpdates(prev => prev.filter(update => update.orderId !== orderId));
  };

  // Send a message via socket
  const sendMessage = (receiverId, content) => {
    if (socket && user) {
      socket.emit('message', {
        senderId: user.id,
        receiverId,
        content
      });
    }
  };

  // Send order notification
  const sendOrderNotification = (userId, orderId, status, message) => {
    if (socket && user) {
      socket.emit('order-notification', {
        userId,
        orderId,
        status,
        message
      });
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        unreadMessages,
        orderUpdates,
        sendMessage,
        sendOrderNotification,
        clearMessageNotifications,
        clearOrderNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Schedule a push notification
async function schedulePushNotification({ title, body, data }) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: data || {},
    },
    trigger: null, // null means immediately
  });
}

// Register for push notifications
async function registerForPushNotificationsAsync() {
  let token;
  
  if (Constants.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    token = (await Notifications.getExpoPushTokenAsync()).data;
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}
