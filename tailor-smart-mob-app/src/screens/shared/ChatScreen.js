import React, { useState, useEffect, useRef, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { getConversation, sendMessage } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';
import ChatMessage from '../../components/chat/ChatMessage';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import colors from '../../styles/colors';
import globalStyles from '../../styles/globalStyles';

const ChatScreen = ({ route, navigation }) => {
  const { userId, name, orderId } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  
  const flatListRef = useRef(null);
  const { user } = useContext(AuthContext);
  const { 
    sendMessage: sendSocketMessage, 
    clearMessageNotifications,
    addMessageListener,
    removeMessageListener 
  } = useContext(NotificationContext);

  // Handle new messages coming via socket
  useEffect(() => {
    const handleNewMessage = (data) => {
      console.log("New message received in ChatScreen:", data);
      // Only update if the message is from the current chat partner
      if (data.senderId === userId) {
        console.log("Adding new message to chat");
        // Add new message to state
        setMessages(prevMessages => [
          ...prevMessages, 
          {
            _id: data._id || Date.now().toString(),
            sender: data.senderId,
            receiver: user.id,
            content: data.content,
            createdAt: data.createdAt || new Date().toISOString()
          }
        ]);
        
        // Clear notification for this sender
        clearMessageNotifications(userId);
        
        // Scroll to bottom
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };
    
    // Register the listener
    console.log("Registering message listener");
    addMessageListener(handleNewMessage);
    
    return () => {
      console.log("Removing message listener");
      removeMessageListener(handleNewMessage);
    };
  }, [userId, user?.id]);

  useEffect(() => {
    // Set the header title to the chat recipient's name
    navigation.setOptions({
      title: name
    });
    
    // Load conversation
    const loadConversation = async () => {
      try {
        console.log(`Loading conversation with ${userId}`);
        const response = await getConversation(userId);
        console.log(`Loaded ${response?.messages?.length || 0} messages`);
        
        // Check response structure and update messages
        if (response && Array.isArray(response.messages)) {
          setMessages(response.messages);
        } else {
          console.warn('Unexpected response format:', response);
          setMessages([]);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
        if (isLoading) {
          Alert.alert('Error', 'Failed to load conversation');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    // Clear notifications for this conversation
    clearMessageNotifications(userId);
    
    // Set up polling for new messages (as backup)
    const intervalId = setInterval(loadConversation, 15000);
    
    return () => clearInterval(intervalId);
  }, [userId]);

  // Load conversation
  const loadConversation = async () => {
    try {
      console.log(`Loading conversation with ${userId}`);
      const response = await getConversation(userId);
      console.log(`Loaded ${response?.messages?.length || 0} messages`);
      setMessages(response?.messages || []);  // Use optional chaining and provide default empty array
    } catch (error) {
      console.error('Error loading conversation:', error);
      if (isLoading) {
        Alert.alert('Error', 'Failed to load conversation');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (inputMessage.trim() === '') return;
    
    // Optimistically add message to UI
    const tempId = Date.now().toString();
    const tempMessage = {
      _id: tempId,
      sender: user.id,
      receiver: userId,
      content: inputMessage,
      createdAt: new Date().toISOString(),
      isTemp: true
    };
    
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    setInputMessage('');
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      setIsSending(true);
      console.log('Sending message...');
      
      // 1. Send via API (for persistence)
      const messageData = {
        receiverId: userId,
        content: inputMessage,
        orderId: orderId || null
      };
      
      // Send to server for database persistence
      const response = await sendMessage(messageData);
      console.log('API message response:', response);
      
      // 2. Send via Socket.IO (for real-time delivery)
      // Include the message ID from the API response
      const socketMessageData = {
        senderId: user.id,
        receiverId: userId,
        content: inputMessage,
        _id: response?.message?._id || tempId
      };
      
      // Send via socket
      const socketSent = sendSocketMessage(userId, inputMessage);
      console.log('Socket message sent:', socketSent);
      
      // Refresh messages to ensure we have the latest data
      await loadConversation();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
      
      // Remove the temp message on failure
      setMessages(prevMessages => 
        prevMessages.filter(msg => msg._id !== tempId)
      );
    } finally {
      setIsSending(false);
    }
  };

  // Render message item
  const renderMessageItem = ({ item }) => {
    const isSender = item.sender === user.id;
    return (
      <ChatMessage 
        message={item} 
        isSender={isSender} 
      />
    );
  };

  // Render empty state
  const renderEmptyChat = () => (
    <View style={styles.emptyChatContainer}>
      <Feather name="message-circle" size={50} color={colors.lightGray} />
      <Text style={styles.emptyChatText}>No messages yet</Text>
      <Text style={styles.emptyChatSubtext}>
        Send a message to start the conversation
      </Text>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading conversation..." />;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : null}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessageItem}
        keyExtractor={item => item._id}
        contentContainerStyle={styles.messageList}
        ListEmptyComponent={renderEmptyChat}
        onContentSizeChange={() => 
          messages && messages.length > 0 && flatListRef.current?.scrollToEnd({ animated: false })
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={inputMessage}
          onChangeText={setInputMessage}
          multiline
          maxLength={500}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton,
            (inputMessage.trim() === '' || isSending) && styles.sendButtonDisabled
          ]} 
          onPress={handleSend}
          disabled={inputMessage.trim() === '' || isSending}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Feather name="send" size={20} color={colors.white} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white
  },
  messageList: {
    padding: 16,
    flexGrow: 1,
    justifyContent: 'flex-end'
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.black,
    marginTop: 16
  },
  emptyChatSubtext: {
    fontSize: 14,
    color: colors.gray,
    textAlign: 'center',
    marginTop: 8
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    backgroundColor: colors.white
  },
  input: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    marginRight: 10
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end'
  },
  sendButtonDisabled: {
    backgroundColor: colors.gray
  }
});

export default ChatScreen;