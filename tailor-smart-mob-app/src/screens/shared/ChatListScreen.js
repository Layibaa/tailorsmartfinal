// tailor-smart-mob-app/src/screens/shared/ChatListScreen.js
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getAllConversations, getUnreadAdminMessagesCount } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';

const ChatListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminUnreadCount, setAdminUnreadCount] = useState(0);
  const { user } = useContext(AuthContext);

  const loadConversations = async () => {
    try {
      // Load both conversations and admin message count in parallel
      const [conversationsRes, unreadRes] = await Promise.all([
        getAllConversations(),
        getUnreadAdminMessagesCount()
      ]);
      
      setConversations(conversationsRes.conversations || []);
      setAdminUnreadCount(unreadRes.data?.unreadCount || 0);
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleChatPress = (conversation) => {
    navigation.navigate('Chat', {
      userId: conversation._id,
      name: conversation.userInfo?.name || 'Chat'
    });
  };

  const handleAdminMessagesPress = () => {
    navigation.navigate('AdminMessages');
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading conversations..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={conversations}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        keyExtractor={(item) => item._id}
        ListEmptyComponent={() => (
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={40} color={colors.lightGray} />
            <Text style={styles.emptyText}>No conversations yet</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.conversationItem}
            onPress={() => handleChatPress(item)}
          >
            <View style={styles.avatar}>
              <Feather
                name={item.userInfo?.role === 'tailor' ? 'scissors' : 'user'}
                size={24}
                color={colors.white}
              />
            </View>
            <View style={styles.content}>
              <Text style={styles.name}>
                {item.userInfo?.name || 'Unknown'}
                <Text style={styles.role}> • {item.userInfo?.role || 'user'}</Text>
              </Text>
              <Text style={styles.message} numberOfLines={1}>
                {item.lastMessage?.content || 'No messages yet'}
              </Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      />

      {/* Admin Messages Button - Fixed Position */}
      <TouchableOpacity
        style={styles.adminMessageButton}
        onPress={handleAdminMessagesPress}
        activeOpacity={0.8}
      >
        <View style={styles.adminButtonContent}>
          <Feather name="shield" size={24} color={colors.white} />
          {adminUnreadCount > 0 && (
            <View style={styles.adminBadge}>
              <Text style={styles.adminBadgeText}>{adminUnreadCount}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>

      {/* Regular Refresh Button */}
      <TouchableOpacity 
        style={styles.refreshButton} 
        onPress={onRefresh}
        activeOpacity={0.8}
      >
        <Feather name="refresh-cw" size={24} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32
  },
  emptyText: {
    fontSize: 16,
    color: colors.gray,
    marginTop: 16
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center'
  },
  content: {
    flex: 1,
    marginLeft: 16
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.black
  },
  role: {
    fontSize: 14,
    color: colors.gray
  },
  message: {
    fontSize: 14,
    color: colors.gray,
    marginTop: 4
  },
  badge: {
    backgroundColor: colors.black,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6
  },
  badgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold'
  },
  
  // Admin Messages Button - Purple with Shield Icon
  adminMessageButton: {
    position: 'absolute',
    bottom: 80,
    right: 20,
    backgroundColor: '#8b5cf6',
    borderRadius: 50,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  },
  adminButtonContent: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center'
  },
  adminBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#ef4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: colors.white
  },
  adminBadgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: 'bold'
  },
  
  // Regular Refresh Button - Black
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.black,
    borderRadius: 50,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8
  }
});

export default ChatListScreen;