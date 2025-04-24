import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import NotificationItem from '../components/NotificationItem';
import Loading from '../components/Loading';
import { theme } from '../utils/theme';
import { fetchNotifications, markNotificationAsRead } from '../services/api';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleNotificationPress = async (notification) => {
    // Mark as read if not already read
    if (!notification.isRead) {
      try {
        await markNotificationAsRead(notification._id);
        
        // Update local state
        setNotifications(prevNotifications => 
          prevNotifications.map(item => 
            item._id === notification._id ? { ...item, isRead: true } : item
          )
        );
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    // Navigate based on notification type
    switch (notification.type) {
      case 'order':
        navigation.navigate('OrderDetail', { orderId: notification.referenceId });
        break;
      case 'message':
        navigation.navigate('Chat', { 
          userId: notification.senderId,
          userName: notification.senderName 
        });
        break;
      default:
        // Just stay on notifications screen for system notifications
        break;
    }
  };

  if (loading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Notifications"
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
      />
      
      {notifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>No notifications</Text>
          <Text style={styles.emptySubtext}>
            You'll see notifications about your orders and messages here
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={({ item }) => (
            <NotificationItem 
              notification={item} 
              onPress={() => handleNotificationPress(item)}
            />
          )}
          keyExtractor={(item) => item._id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
    textAlign: 'center',
  },
});

export default NotificationsScreen;