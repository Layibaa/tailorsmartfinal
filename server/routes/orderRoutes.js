// server/routes/orderRoutes.js - UPDATED with price negotiation endpoints
const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

const { 
  createOrder, 
  updateOrderStatus,
  confirmOrder,
  deleteOrder,
  lockOrder,
  updateOrderDetails,
  getOrderDetails,
  requestPriceNegotiation,  // NEW
  updateOrderPrice          // NEW
} = require('../controllers/orderController');

// Debug middleware
router.use((req, res, next) => {
  console.log(`🛣️ Order Route: ${req.method} ${req.path}`);
  console.log(`📦 Body:`, req.body);
  next();
});

// EXISTING ROUTES
router.post('/', auth, createOrder);
router.get('/:id', auth, getOrderDetails);
router.patch('/:id/status', auth, updateOrderStatus);
router.patch('/:id/confirm', auth, confirmOrder);
router.patch('/:id/lock', auth, lockOrder);
router.put('/:id', auth, updateOrderDetails);
router.delete('/:id', auth, deleteOrder);

// NEW ROUTES - Price Negotiation
router.post('/:id/negotiate-price', auth, requestPriceNegotiation);  // Customer requests negotiation
router.patch('/:id/update-price', auth, updateOrderPrice);            // Tailor updates price (once)

module.exports = router;