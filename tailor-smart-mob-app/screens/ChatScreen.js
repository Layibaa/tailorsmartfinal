import React, { useState, useEffect, useRef, useContext } from 'react';
import { View, FlatList, StyleSheet, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import { theme } from '../utils/theme';
import { fetchMessages, sendMessage } from '../services/api';
import { AuthContext } from '../services/auth';
import { connectSocket } from '../services/socket';

const ChatScreen = ({ route, navigation }) => {
  const { userId, userName } = route.params;
  const { authState } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [typingStatus, setTypingStatus] = useState(false);
  const flatListRef = useRef(null);
  const socket = useRef(null);
  
  // Load chat history
  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await fetchMessages(userId);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    
    // Initialize socket connection
    socket.current = connectSocket();
    
    // Join chat room
    socket.current.emit('join_chat', {
      senderId: authState.user?._id,
      receiverId: userId
    });
    
    // Listen for incoming messages
    socket.current.on('new_message', (message) => {
      // Only add the message if it's from the current chat
      if (message.senderId === userId || message.receiverId === userId) {
        setMessages(prevMessages => [message, ...prevMessages]);
      }
    });
    
    // Listen for typing indicators
    socket.current.on('typing', ({ userId: typingUserId, isTyping }) => {
      if (typingUserId === userId) {
        setTypingStatus(isTyping);
      }
    });
    
    return () => {
      // Leave chat room and disconnect
      socket.current.emit('leave_chat', {
        senderId: authState.user?._id,
        receiverId: userId
      });
      socket.current.disconnect();
    };
  }, [userId]);

  const handleSend = async (text) => {
    try {
      const sentMessage = await sendMessage(userId, text);
      // We'll let the socket event handle adding the message to the list
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const renderItem = ({ item }) => {
    const isMine = item.senderId === authState.user?._id;
    return (
      <ChatBubble
        message={item.content}
        isMine={isMine}
        timestamp={item.createdAt}
      />
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Header
        title={userName}
        leftIcon="arrow-back"
        onLeftPress={() => navigation.goBack()}
        rightIcon="information-circle-outline"
        onRightPress={() => {}}
      />
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.messageList}
          inverted
        />
      )}
      
      {typingStatus && (
        <View style={styles.typingContainer}>
          <ActivityIndicator size="small" color={theme.colors.textLight} />
        </View>
      )}
      
      <MessageInput onSend={handleSend} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageList: {
    padding: 16,
  },
  typingContainer: {
    padding: 8,
    alignItems: 'flex-start',
    marginLeft: 16,
  },
});

export default ChatScreen;