// server/routes/orderRoutes.js - REMOVED PRICE NEGOTIATION ROUTES
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

const { 
  createOrder, 
  updateOrderStatus,
  confirmOrder,
  deleteOrder, 
  getOrderDetails
} = require('../controllers/orderController');

// Debug middleware - logs all requests
router.use((req, res, next) => {
  console.log('\n🛣️ ================================');
  console.log('🛣️ ORDER ROUTE HIT');
  console.log('🛣️ Method:', req.method);
  console.log('🛣️ Path:', req.path);
  console.log('🛣️ Full URL:', req.originalUrl);
  console.log('🛣️ Body:', JSON.stringify(req.body, null, 2));
  console.log('🛣️ Params:', req.params);
  console.log('🛣️ ================================\n');
  next();
});

// Order status and confirmation routes
router.patch('/:id/status', auth, updateOrderStatus);
router.patch('/:id/confirm', auth, confirmOrder);

// Basic CRUD routes
router.post('/', auth, createOrder);
router.get('/:id', auth, getOrderDetails);
router.delete('/:id', auth, deleteOrder);

// Log all registered routes
console.log('✅ Order Routes Registered:');
console.log('   POST   /orders');
console.log('   GET    /orders/:id');
console.log('   PATCH  /orders/:id/status');
console.log('   PATCH  /orders/:id/confirm');
console.log('   DELETE /orders/:id');

module.exports = router;