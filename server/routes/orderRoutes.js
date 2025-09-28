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
  getOrderDetails  // ✅ Added missing endpoint
} = require('../controllers/orderController');

// ✅ All routes properly defined
router.post('/', auth, createOrder);
router.get('/:id', auth, getOrderDetails);          // ✅ GET route for order details
router.patch('/:id/status', auth, updateOrderStatus);
router.patch('/:id/confirm', auth, confirmOrder);
router.patch('/:id/lock', auth, lockOrder);         // ✅ PATCH for lock (correct method)
router.put('/:id', auth, updateOrderDetails);
router.delete('/:id', auth, deleteOrder);

module.exports = router;