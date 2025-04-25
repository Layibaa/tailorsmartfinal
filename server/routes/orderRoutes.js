const express = require('express');
const router = express.Router();
const {
  createOrder,
  getOrders,
  getRecentOrders,
  getOrderById,
  updateOrderStatus,
  updateOrder,
  deleteOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');
const { isCustomer, isAdminOrTailor } = require('../middleware/roles');

// All routes are protected - require authentication
router.use(protect);

// Get all orders (filtered by user role)
router.get('/', getOrders);

// Get recent orders
router.get('/recent', getRecentOrders);

// Create new order (customer only)
router.post('/', isCustomer, createOrder);

// Get order by ID
router.get('/:id', getOrderById);

// Update order status (admin or tailor only)
router.put('/:id/status', isAdminOrTailor, updateOrderStatus);

// Update order details
router.put('/:id', updateOrder);

// Delete order (cancel - customer only)
router.delete('/:id', deleteOrder);

module.exports = router;
