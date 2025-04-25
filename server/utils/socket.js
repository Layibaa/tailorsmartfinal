const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Socket.io setup and connection handling
module.exports = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }
      
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from token
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user to socket
      socket.user = {
        id: user._id.toString(),
        name: user.name,
        role: user.role
      };
      
      next();
    } catch (error) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // On connection
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.id}`);
    
    // Join user's own room for direct messages
    socket.join(socket.user.id);
    
    // Handle joining a chat room (for private messaging)
    socket.on('join_chat', ({ senderId, receiverId }) => {
      // Create a unique room name for this chat pair
      const roomName = [senderId, receiverId].sort().join('-');
      socket.join(roomName);
      console.log(`${socket.user.name} joined room: ${roomName}`);
    });
    
    // Handle leaving a chat room
    socket.on('leave_chat', ({ senderId, receiverId }) => {
      const roomName = [senderId, receiverId].sort().join('-');
      socket.leave(roomName);
      console.log(`${socket.user.name} left room: ${roomName}`);
    });
    
    // Handle new message
    socket.on('send_message', (messageData) => {
      const { receiverId, content } = messageData;
      
      // Emit to the receiver's room
      socket.to(receiverId).emit('new_message', {
        senderId: socket.user.id,
        senderName: socket.user.name,
        receiverId,
        content,
        createdAt: new Date()
      });
    });
    
    // Handle typing indicator
    socket.on('typing', ({ receiverId, isTyping }) => {
      socket.to(receiverId).emit('typing', {
        userId: socket.user.id,
        isTyping
      });
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.user.id}`);
    });
  });

  return io;
};
