import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../utils/theme';

const NotificationItem = ({ notification, onPress }) => {
  const { title, message, createdAt, isRead, type } = notification;

  const getIconForType = () => {
    switch (type) {
      case 'order':
        return 'shirt-outline';
      case 'message':
        return 'chatbubble-outline';
      case 'system':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'order':
        return theme.colors.success;
      case 'message':
        return theme.colors.primary;
      case 'system':
        return theme.colors.warning;
      default:
        return theme.colors.textLight;
    }
  };

  // Format date
  const formatDate = (date) => {
    const now = new Date();
    const dateObj = new Date(date);
    const diffInMs = now - dateObj;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      // Today - show time
      return dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      // Within a week - show day name
      return dateObj.toLocaleDateString([], { weekday: 'long' });
    } else {
      // Older - show date
      return dateObj.toLocaleDateString();
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, isRead ? styles.read : styles.unread]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${getIconColor()}20` }]}>
        <Ionicons name={getIconForType()} size={24} color={getIconColor()} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
        <Text style={styles.time}>{formatDate(createdAt)}</Text>
      </View>
      {!isRead && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  read: {
    backgroundColor: theme.colors.background,
  },
  unread: {
    backgroundColor: `${theme.colors.primary}05`,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  message: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: theme.colors.textLight,
    marginBottom: 8,
    lineHeight: 20,
  },
  time: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: theme.colors.textLight,
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.primary,
    alignSelf: 'center',
  },
});

export default NotificationItem;
