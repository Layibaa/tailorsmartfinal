// tailor-smart-mob-app/src/screens/shared/AdminMessagesScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getUserAdminMessages, markMessageAsRead } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import colors from '../../styles/colors';

const AdminMessagesScreen = ({ navigation }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);

  const loadMessages = async () => {
    try {
      setError(null);
      const response = await getUserAdminMessages();
      
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error loading admin messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadMessages();
  };

  const handleMarkAsRead = async (messageId) => {
    try {
      await markMessageAsRead(messageId);
      // Update local state
      setMessages(prev =>
        prev.map(msg =>
          msg._id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getRecipientTypeColor = (type) => {
    switch (type) {
      case 'all':
        return '#8b5cf6'; // Purple
      case 'customers':
        return '#3b82f6'; // Blue
      case 'tailors':
        return '#f97316'; // Orange
      default:
        return '#6b7280'; // Gray
    }
  };

  const renderMessage = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.messageCard,
        !item.isRead && styles.unreadMessage
      ]}
      onPress={() => handleMarkAsRead(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.messageHeader}>
        <View style={styles.headerLeft}>
          <View style={[
            styles.adminBadge,
            { backgroundColor: getRecipientTypeColor(item.recipientType) }
          ]}>
            <Feather name="shield" size={14} color={colors.white} />
          </View>
          <View>
            <Text style={styles.adminLabel}>TailorSmart Admin</Text>
            <Text style={styles.messageDate}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        
        {!item.isRead && (
          <View style={styles.unreadDot} />
        )}
      </View>

      <View style={styles.recipientTypeBadge}>
        <Text style={styles.recipientTypeText}>
          {item.recipientType === 'all' 
            ? '📢 General Announcement'
            : item.recipientType === 'customers'
            ? '👥 For Customers'
            : '✂️ For Tailors'
          }
        </Text>
      </View>

      <Text style={styles.messageContent} numberOfLines={4}>
        {item.content}
      </Text>

      {!item.isRead && (
        <Text style={styles.tapToRead}>Tap to mark as read</Text>
      )}
    </TouchableOpacity>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <Feather name="bell" size={64} color={colors.lightGray} />
      </View>
      <Text style={styles.emptyTitle}>No Admin Messages</Text>
      <Text style={styles.emptyText}>
        You'll see important announcements and updates from TailorSmart admin here
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.black} />
        <Text style={styles.loadingText}>Loading messages...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Feather name="arrow-left" size={24} color={colors.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Admin Messages</Text>
        <TouchableOpacity onPress={loadMessages} style={styles.refreshButton}>
          <Feather name="refresh-cw" size={22} color={colors.black} />
        </TouchableOpacity>
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={20} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Info Banner */}
      <View style={styles.infoBanner}>
        <Feather name="info" size={16} color="#3b82f6" />
        <Text style={styles.infoText}>
          Messages from admin are read-only announcements
        </Text>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item._id}
        contentContainerStyle={messages.length === 0 ? styles.emptyList : styles.messageList}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.black}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  backButton: {
    padding: 8
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.black,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16
  },
  refreshButton: {
    padding: 8
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#bfdbfe'
  },
  infoText: {
    fontSize: 13,
    color: '#1e40af',
    marginLeft: 8,
    flex: 1
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fca5a5'
  },
  errorText: {
    fontSize: 13,
    color: '#991b1b',
    marginLeft: 8,
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: colors.gray
  },
  messageList: {
    padding: 16
  },
  emptyList: {
    flex: 1
  },
  messageCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  unreadMessage: {
    backgroundColor: '#f0f9ff',
    borderColor: '#3b82f6',
    borderWidth: 2
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  adminBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  adminLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 2
  },
  messageDate: {
    fontSize: 12,
    color: colors.gray
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3b82f6'
  },
  recipientTypeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12
  },
  recipientTypeText: {
    fontSize: 12,
    color: '#4b5563',
    fontWeight: '500'
  },
  messageContent: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.black
  },
  tapToRead: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
    marginTop: 12,
    textAlign: 'right'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32
  },
  emptyIconContainer: {
    marginBottom: 24
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.black,
    marginBottom: 8
  },
  emptyText: {
    fontSize: 15,
    color: colors.gray,
    textAlign: 'center',
    lineHeight: 22
  }
});

export default AdminMessagesScreen;