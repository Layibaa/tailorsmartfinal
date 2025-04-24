import io from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../utils/constants';

let socket = null;

// Function to initialize and connect to the socket server
export const connectSocket = async () => {
  if (socket && socket.connected) {
    return socket;
  }

  try {
    // Get the JWT token for authentication
    const token = await SecureStore.getItemAsync('token');

    if (!token) {
      console.error('No token found, cannot connect to socket');
      return null;
    }

    // Create a new socket connection
    socket = io(API_URL, {
      auth: {
        token,
      },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // Set up event listeners
    socket.on('connect', () => {
      console.log('Socket connected');
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
    });

    socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
    });

    return socket;
  } catch (error) {
    console.error('Error connecting to socket:', error);
    return null;
  }
};

// Function to disconnect the socket
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('Socket disconnected');
  }
};

// Function to get the current socket instance
export const getSocket = () => {
  return socket;
};

// Function to emit an event to the server
export const emitEvent = (event, data, callback) => {
  if (socket) {
    socket.emit(event, data, callback);
  } else {
    console.error('Socket not connected, cannot emit event:', event);
  }
};

// Function to listen for an event from the server
export const onEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback);
  } else {
    console.error('Socket not connected, cannot listen for event:', event);
  }
};

// Function to stop listening for an event
export const offEvent = (event, callback) => {
  if (socket) {
    socket.off(event, callback);
  }
};

export default {
  connectSocket,
  disconnectSocket,
  getSocket,
  emitEvent,
  onEvent,
  offEvent,
};
