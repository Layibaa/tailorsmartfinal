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
import { getAllConversations } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';

const ChatListScreen = ({ navigation }) => {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useContext(AuthContext);

  const loadConversations = async () => {
    try {
      const response = await getAllConversations();
      setConversations(response.conversations || []);
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

      {/* Refresh Button */}
      <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
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
  refreshButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: colors.black,
    borderRadius: 50,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default ChatListScreen;
