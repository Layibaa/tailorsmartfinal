import { API_URL } from './api';
import io from 'socket.io-client';

class ChatService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.messageListeners = [];
    this.connectionStateListeners = [];
  }

  // Initialize Socket.IO connection
  connect(userToken, userId) {
    if (this.socket && this.isConnected) {
      return;
    }

    try {
      this.socket = io(API_URL, {
        transports: ['websocket'], // Use WebSocket transport
        query: {
          token: userToken,
          userId: userId
        }
      });

      // Connection successful
      this.socket.on('connect', () => {
        console.log('Socket.IO connected');
        this.isConnected = true;
        this.notifyConnectionStateListeners(true);
      });

      // Listen for incoming messages
      this.socket.on('message', (data) => {
        try {
          this.notifyMessageListeners(data);
        } catch (error) {
          console.error('Error handling incoming message:', error);
        }
      });

      // Connection error
      this.socket.on('connect_error', (error) => {
        console.error('Socket.IO connection error:', error);
        this.isConnected = false;
        this.notifyConnectionStateListeners(false);
      });

      // Disconnected
      this.socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        this.isConnected = false;
        this.notifyConnectionStateListeners(false);

        // Optionally reconnect
        setTimeout(() => {
          if (!this.isConnected) {
            this.connect(userToken, userId);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('Failed to connect to Socket.IO server:', error);
    }
  }

  // Disconnect Socket.IO
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionStateListeners(false);
    }
  }

  // Send a chat message
  sendMessage(receiverId, content) {
    if (this.socket && this.isConnected) {
      const message = {
        receiverId: receiverId,
        content: content,
        timestamp: new Date().toISOString()
      };
      
      this.socket.emit('chat', message);
      return true;
    } else {
      console.error('Socket.IO not connected. Cannot send message.');
      return false;
    }
  }

  // Add a listener for incoming messages
  addMessageListener(callback) {
    this.messageListeners.push(callback);
  }

  // Remove a message listener
  removeMessageListener(callback) {
    this.messageListeners = this.messageListeners.filter(
      listener => listener !== callback
    );
  }

  // Notify all message listeners
  notifyMessageListeners(data) {
    this.messageListeners.forEach(listener => {
      listener(data);
    });
  }

  // Add a connection state listener
  addConnectionStateListener(callback) {
    this.connectionStateListeners.push(callback);
  }

  // Remove a connection state listener
  removeConnectionStateListener(callback) {
    this.connectionStateListeners = this.connectionStateListeners.filter(
      listener => listener !== callback
    );
  }

  // Notify all connection state listeners
  notifyConnectionStateListeners(isConnected) {
    this.connectionStateListeners.forEach(listener => {
      listener(isConnected);
    });
  }

  // Check if socket is connected
  isSocketConnected() {
    return this.isConnected && this.socket && this.socket.connected;
  }
}

// Export a singleton instance
export default new ChatService();
