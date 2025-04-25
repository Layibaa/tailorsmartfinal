const express = require('express');
const router = express.Router();

// Import route files
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const tailorRoutes = require('./tailorRoutes');
const orderRoutes = require('./orderRoutes');
const chatRoutes = require('./chatRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/tailors', tailorRoutes);
router.use('/orders', orderRoutes);
router.use('/chat', chatRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

// Default route
router.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'TailorSmart API',
    version: '1.0.0',
  });
});

module.exports = router;
