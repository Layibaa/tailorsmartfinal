import { API_URL } from './api';
import WebSocket from 'react-native-websocket';

class ChatService {
  constructor() {
    this.socket = null;
    this.messageListeners = [];
    this.connectionStateListeners = [];
    this.isConnected = false;
  }

  // Initialize WebSocket connection
  connect(userToken, userId) {
    if (this.socket && this.isConnected) {
      return;
    }

    // Get WebSocket URL from API URL (replace http/https with ws/wss)
    const wsProtocol = API_URL.startsWith('https') ? 'wss' : 'ws';
    const wsUrl = `${wsProtocol}://${API_URL.replace(/^https?:\/\//, '')}/ws`;

    try {
      // Create WebSocket connection
      this.socket = new WebSocket(wsUrl);

      // Connection opened
      this.socket.onopen = () => {
        console.log('WebSocket connection established');
        this.isConnected = true;
        
        // Register user with WebSocket server
        this.socket.send(JSON.stringify({
          type: 'register',
          userId: userId,
          token: userToken
        }));
        
        // Notify listeners of connection state change
        this.notifyConnectionStateListeners(true);
      };

      // Listen for messages
      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.notifyMessageListeners(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      // Listen for errors
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.notifyConnectionStateListeners(false);
      };

      // Connection closed
      this.socket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        this.isConnected = false;
        this.notifyConnectionStateListeners(false);
        
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (!this.isConnected) {
            this.connect(userToken, userId);
          }
        }, 5000);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
    }
  }

  // Disconnect WebSocket
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
      this.notifyConnectionStateListeners(false);
    }
  }

  // Send a chat message
  sendMessage(receiverId, content) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      const message = {
        type: 'chat',
        receiverId: receiverId,
        content: content,
        timestamp: new Date().toISOString()
      };
      
      this.socket.send(JSON.stringify(message));
      return true;
    } else {
      console.error('WebSocket not connected. Cannot send message.');
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
    return this.isConnected && this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// Export a singleton instance
export default new ChatService();
