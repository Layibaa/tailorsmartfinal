const express = require('express');
const cors = require('cors');
const { connectDB, disconnectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const { errorHandler } = require('./middlewares/authMiddleware');

// Load environment variables
require('dotenv').config();

// Create Express App
const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/api/auth', authRoutes);

// Base route
app.get('/', (req, res) => {
  res.json({ message: 'TailorSmart API is running...' });
});

// Error handler middleware
app.use(errorHandler);

// Port
const PORT = process.env.PORT || 8000;

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('SIGINT received. Shutting down gracefully');
  await disconnectDB();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Shutting down gracefully');
  await disconnectDB();
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});
