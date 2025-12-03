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
  const [messageListeners, setMessageListeners] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user, userToken } = useContext(AuthContext);

  // Initialize socket.io connection
  useEffect(() => {
    if (userToken && user) {
      console.log('Connecting to socket.io server...');
      // Connect to the server
      const newSocket = io(API_URL.replace('/api/v1', ''), {
        auth: {
          token: userToken
        }
      });
      
      setSocket(newSocket);
      
      // Join user-specific room
      newSocket.emit('join', user.id);
      console.log(`Joined room: ${user.id}`);
      
  // Listen for new messages
      newSocket.on('new-message', (data) => {
        console.log('Received new message via socket:', data);
        
        // Increase unread count
        setUnreadMessages((prev) => prev + 1);
        
        // Add to notifications
        // Listen for order updates
      newSocket.on('order-update', (data) => {
        // Add to order updates
        setOrderUpdates((prev) => [data, ...prev]);
        
        // Add to notifications
        const newNotification = {
          id: Date.now().toString(),
          type: 'order',
          title: 'Order Update',
          body: data.message,
          timestamp: new Date().toISOString(),
          read: false,
          data: { screen: 'OrderDetails', orderId: data.orderId }
        };
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show notification
        schedulePushNotification({
          title: 'Order Update',
          body: data.message,
          data: { screen: 'OrderDetails', orderId: data.orderId }
        });
      });

        setNotifications(prev => [newNotification, ...prev]);
        
        // Notify all registered listeners
        messageListeners.forEach(listener => listener(data));
        
        // Show notification
        schedulePushNotification({
          title: 'New Message',
          body: data.content,
          data: { screen: 'Chat', senderId: data.senderId }
        });
      });

      // Handle socket connection errors
      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Handle successful connection
      newSocket.on('connect', () => {
        console.log('Socket successfully connected');
      });
      
      return () => {
        console.log('Disconnecting socket...');
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
  console.log(`Sending message to ${receiverId}: ${content}`);
  if (socket && user) {
    // Make sure this matches what your server expects
    socket.emit('message', {
      senderId: user.id,
      receiverId,
      content
    });
    return true;
  } else {
    console.error('Socket not connected or user not set');
    return false;
  }
};

  // Add a message listener
  const addMessageListener = (callback) => {
    console.log('Adding message listener');
    setMessageListeners(prev => [...prev, callback]);
  };

  // Remove a message listener
  const removeMessageListener = (callback) => {
    console.log('Removing message listener');
    setMessageListeners(prev => prev.filter(listener => listener !== callback));
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
// Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  // Clear all notifications
  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Get unread notification count
  const getUnreadNotificationCount = () => {
    return notifications.filter(n => !n.read).length;
  };
  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        unreadMessages,
        orderUpdates,
        notifications,
        sendMessage,
        sendOrderNotification,
        clearMessageNotifications,
        clearOrderNotification,
        addMessageListener,
        removeMessageListener,
        markNotificationAsRead,
        clearAllNotifications,
        getUnreadNotificationCount
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