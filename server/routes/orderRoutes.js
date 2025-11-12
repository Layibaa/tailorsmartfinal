// server/routes/orderRoutes.js
// ✅ UPDATED: Added sketch refinement endpoints

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

// ✅ EXISTING ROUTES
router.post('/', auth, createOrder);
router.get('/:id', auth, getOrderDetails);
router.patch('/:id/status', auth, updateOrderStatus);
router.patch('/:id/confirm', auth, confirmOrder);
router.patch('/:id/lock', auth, lockOrder);
router.put('/:id', auth, updateOrderDetails);
router.delete('/:id', auth, deleteOrder);
 

// Export router
module.exports = router;