// server/routes/orderRoutes.js - Price negotiation only
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

const { 
  createOrder, 
  updateOrderStatus,
  confirmOrder,
  deleteOrder, 
  getOrderDetails,
  requestPriceNegotiation,
  updateOrderPrice
} = require('../controllers/orderController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`🛣️ Order Route: ${req.method} ${req.path}`);
  console.log(`📦 Body:`, req.body);
  next();
});

// Basic order routes
router.post('/', auth, createOrder);
router.get('/:id', auth, getOrderDetails);
router.patch('/:id/status', auth, updateOrderStatus);
router.patch('/:id/confirm', auth, confirmOrder); 
router.delete('/:id', auth, deleteOrder);

// Price negotiation routes
router.post('/:id/negotiate-price', auth, requestPriceNegotiation);
router.patch('/:id/update-price', auth, updateOrderPrice);

module.exports = router;