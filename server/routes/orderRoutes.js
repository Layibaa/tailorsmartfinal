// COMPLETE: server/routes/orderRoutes.js
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
  getOrderDetails
} = require('../controllers/orderController');

// Debug middleware to log all requests
router.use((req, res, next) => {
  console.log(`🛣️ Order Route: ${req.method} ${req.path}`);
  console.log(`📦 Body:`, req.body);
  next();
});

// ✅ ALL ROUTES PROPERLY DEFINED
router.post('/', auth, createOrder);
router.get('/:id', auth, getOrderDetails);
router.patch('/:id/status', auth, updateOrderStatus);
router.patch('/:id/confirm', auth, confirmOrder);
router.patch('/:id/lock', auth, lockOrder);         // ✅ LOCK ROUTE
router.put('/:id', auth, updateOrderDetails);       // ✅ UPDATE ROUTE
router.delete('/:id', auth, deleteOrder);

// Export router
module.exports = router;