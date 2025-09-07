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
// Add these imports to existing server.js
const adminAuthRoutes = require('./routes/adminAuthRoutes');
const corsOptions = require('./middleware/cors');
const Logger = require('./utils/logger');
const auditLog = require('./middleware/auditLog');

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
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(cors(corsOptions));

// Add request logging middleware (add after cors, before routes)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/admin')) {
    Logger.info(`${req.method} ${req.path}`, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });
  }
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/tailors', tailorRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/messages', messageRoutes);
// Add these routes after existing routes
app.use('/api/v1/admin', auditLog('admin-access'), adminRoutes);


// Admin auth routes (public + protected)
app.use('/api/v1/admin/auth', adminAuthRoutes);

// Admin management routes (all protected)
app.use('/api/v1/admin', adminRoutes);

// Optional: Add admin-specific error handling
app.use('/api/v1/admin', (error, req, res, next) => {
  console.error('Admin API Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(error.errors).map(e => e.message)
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }
  
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Add error logging
app.use((err, req, res, next) => {
  if (req.path.startsWith('/api/v1/admin')) {
    Logger.error('Admin API Error', {
      error: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
      ip: req.ip
    });
  }
  
  // Call your existing error handler
  next(err);
});

app.use("/api/predict", require("./routes/predict"));


// Error handling middleware
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

// Store connected users
const connectedClients = new Map();

// WebSocket connection handling
wss.on('connection', (ws, req) => {
  console.log('New WebSocket connection');

  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      // Handle different message types
      if (parsedMessage.type === 'register') {
        // Register user connection
        connectedClients.set(parsedMessage.userId, ws);
        console.log(`User ${parsedMessage.userId} registered`);
      } else if (parsedMessage.type === 'chat') {
        // Handle chat message
        const receiverWs = connectedClients.get(parsedMessage.receiverId);

        // If receiver is connected, send the message
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

  // Handle connection close
  ws.on('close', () => {
    // Remove user from connected clients
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

  // Join room for user-specific notifications
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`Socket ${socket.id} joined room: ${userId}`);
  });

  // Handle new message
  socket.on('message', async (data) => {
    try {
      console.log('Received message via socket:', data);
      const userId = connectedClients.get(socket.id);

      if (!userId) {
        console.error('No user ID found for socket:', socket.id);
        return;
      }

      // Create message in database
      const message = await Message.create({
        sender: userId,
        receiver: data.receiverId,
        content: data.content,
        order: data.orderId || null
      });

      // Emit to recipient's room
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

  // Handle order notifications
  socket.on('order-notification', (data) => {
    io.to(data.userId).emit('order-update', {
      orderId: data.orderId,
      status: data.status,
      message: data.message
    });
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

// Handle Mongoose deprecation warning
mongoose.set('strictQuery', true);

// Import MongoMemoryServer for development/testing if needed
const { MongoMemoryServer } = require('mongodb-memory-server');

// Start server
const PORT = process.env.PORT || 5000;
const start = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;

    // If no MongoDB URI is provided, use in-memory database
    if (!mongoUri) {
      console.log('No MongoDB URI found, using in-memory database');
      const mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

start();