const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import controllers from your orderController
const { 
  createOrder, 
  updateOrderStatus,
  confirmOrder
} = require('../controllers/orderController');

// Connect routes to controller functions
router.post('/', auth, createOrder);
router.patch('/:id/status', auth, updateOrderStatus);
router.patch('/:id/confirm', auth, confirmOrder);

module.exports = router;