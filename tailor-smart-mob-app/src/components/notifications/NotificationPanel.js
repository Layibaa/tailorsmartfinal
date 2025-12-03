import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import colors from '../../styles/colors';

const NotificationPanel = ({ visible, onClose, notifications, onNotificationPress }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => onNotificationPress(item)}
    >
      <View style={styles.notificationIcon}>
        <Feather
          name={item.type === 'message' ? 'message-circle' : 'package'}
          size={20}
          color={colors.white}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationBody} numberOfLines={2}>
          {item.body}
        </Text>
        <Text style={styles.notificationTime}>{formatTime(item.timestamp)}</Text>
      </View>
      {!item.read && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Notifications</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Feather name="x" size={24} color={colors.black} />
            </TouchableOpacity>
          </View>

          {/* Notifications List */}
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Feather name="bell-off" size={50} color={colors.lightGray} />
                <Text style={styles.emptyText}>No notifications yet</Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.black
  },
  closeButton: {
    padding: 4
  },
  listContent: {
    flexGrow: 1
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
    backgroundColor: colors.white
  },
  unreadNotification: {
    backgroundColor: '#f0f9ff'
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center'
  },
  notificationContent: {
    flex: 1,
    marginLeft: 12
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 4
  },
  notificationBody: {
    fontSize: 14,
    color: colors.gray,
    marginBottom: 4
  },
  notificationTime: {
    fontSize: 12,
    color: colors.gray
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
    marginLeft: 8
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    marginTop: 16
  }
});

export default NotificationPanel;