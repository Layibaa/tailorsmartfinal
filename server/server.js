require('dotenv').config();
require('express-async-errors');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const WebSocket = require('ws');
const { WebSocketServer } = require('ws');

// Import routes
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const tailorRoutes = require('./routes/tailorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const orderRoutes = require('./routes/orderRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');

// Import middleware
const errorHandlerMiddleware = require('./middleware/errorHandler');
const notFoundMiddleware = require('./middleware/notFound');

// Create Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Set up socket.io for real-time chat
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
});

// Set up WebSocket server for chat
const wss = new WebSocketServer({ server, path: '/ws' });

// Security middleware
app.use(helmet());
app.use(cors());
app.use(xss());

// ✅ FIXED: Increase body size limit to handle base64 images (up to 10MB)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
if (process.env.NODE_ENV === 'production') {
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
  });
  app.use(limiter);
}

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/tailors', tailorRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/reviews', reviewRoutes);

// Error handling middleware (MUST BE AFTER ROUTES)
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Store connected users
const connectedClients = new Map();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.type === 'register') {
        connectedClients.set(parsedMessage.userId, ws);
        console.log(`User ${parsedMessage.userId} registered`);
      } else if (parsedMessage.type === 'chat') {
        const receiverWs = connectedClients.get(parsedMessage.receiverId);
        if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
          receiverWs.send(JSON.stringify({
            type: 'chat',
            senderId: parsedMessage.senderId,
            content: parsedMessage.content,
            timestamp: new Date()
          }));
        }
      }
    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    for (const [userId, client] of connectedClients.entries()) {
      if (client === ws) {
        connectedClients.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New socket.io connection:', socket.id);

  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room: ${userId}`);
  });

  socket.on('message', async (data) => {
    try {
      console.log('Received message via socket:', data);
      const userId = connectedClients.get(socket.id);

      if (!userId) {
        console.error('No user ID found for socket:', socket.id);
        return;
      }

      const Message = require('./models/Message');
      const message = await Message.create({
        sender: userId,
        receiver: data.receiverId,
        content: data.content,
        order: data.orderId || null
      });

      io.to(data.receiverId).emit('new-message', {
        _id: message._id.toString(),
        sender: userId,
        receiver: data.receiverId,
        content: data.content,
        createdAt: message.createdAt
      });
    } catch (error) {
      console.error('Error handling socket message:', error);
    }
  });

  socket.on('order-notification', (data) => {
    io.to(data.userId).emit('order-update', {
      orderId: data.orderId,
      status: data.status,
      message: data.message
    });
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Handle Mongoose deprecation warning
mongoose.set('strictQuery', true);

// Start server
const PORT = process.env.PORT || 5000;
const start = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    if (!mongoUri) {
      console.log('No MongoDB URI found, using in-memory database');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
    }

    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    console.log('✅ Review routes registered at /api/v1/reviews');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📦 Body size limit: 10mb (for image uploads)`);
    });
  } catch (error) {
    console.error('❌ Error starting server:', error);
  }
};

start();