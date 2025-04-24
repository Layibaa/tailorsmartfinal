import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import Loading from '../components/Loading';
import { theme } from '../utils/theme';
import { fetchChatList } from '../services/api';
import { AuthContext } from '../services/auth';
import { connectSocket } from '../services/socket';

const ChatListScreen = ({ navigation }) => {
  const { authState } = useContext(AuthContext);
  const [chatList, setChatList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadChatList = async () => {
    try {
      setLoading(true);
      const data = await fetchChatList();
      setChatList(data);
    } catch (error) {
      console.error('Error fetching chat list:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadChatList();
    setRefreshing(false);
  };

  useEffect(() => {
    loadChatList();
    
    // Connect to socket.io for real-time updates
    const socket = connectSocket();
    
    // Listen for new messages to update the chat list
    socket.on('new_message', (message) => {
      setChatList(prevChats => {
        // If the user is part of this conversation, update the last message
        const updatedChats = prevChats.map(chat => {
          if (chat.user._id === message.senderId || chat.user._id === message.receiverId) {
            return {
              ...chat,
              lastMessage: {
                text: message.content,
                createdAt: message.createdAt,
              },
              unreadCount: chat.unreadCount + 1,
            };
          }
          return chat;
        });
        
        return updatedChats;
      });
    });
    
    return () => {
      // Clean up socket connection
      socket.disconnect();
    };
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Today - show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // This week - show day name
    const dayDiff = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (dayDiff < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Older - show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderChatItem = ({ item }) => {
    const { user, lastMessage, unreadCount } = item;
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigation.navigate('Chat', { userId: user._id, userName: user.name })}
      >
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.timeText}>
              {lastMessage ? formatTime(lastMessage.createdAt) : ''}
            </Text>
          </View>
          
          <View style={styles.messageContainer}>
            <Text 
              style={styles.messageText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {lastMessage ? lastMessage.text : 'Start a conversation'}
            </Text>
            
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCount}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && !refreshing) {
    return <Loading />;
  }

  return (
    <View style={styles.container}>
      <Header
        title="Messages"
        leftIcon="menu"
        onLeftPress={() => navigation.openDrawer()}
      />
      
      {chatList.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubble-ellipses-outline" size={64} color={theme.colors.textLight} />
          <Text style={styles.emptyText}>No conversations yet</Text>
          <Text style={styles.emptySubtext}>
            Your conversations with tailors and customers will appear here
          </Text>
        </View>
      ) : (
        <FlatList
          data={chatList}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.user._id}
          contentContainerStyle={styles.listContent}
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
  listContent: {
    paddingVertical: 8,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    color: theme.colors.white,
    fontFamily: 'Poppins-Medium',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    color: theme.colors.text,
  },
  timeText: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.textLight,
  },
  unreadBadge: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  unreadCount: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    color: theme.colors.white,
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

export default ChatListScreen;