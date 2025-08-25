const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

const { 
  createOrder, 
  updateOrderStatus,
  confirmOrder,
  deleteOrder,
  lockOrder,
  updateOrderDetails // ✅ new
} = require('../controllers/orderController');

router.post('/', auth, createOrder);
router.patch('/:id/status', auth, updateOrderStatus);
router.patch('/:id/confirm', auth, confirmOrder);
router.patch('/:id/lock', auth, lockOrder);
router.put('/:id', auth, updateOrderDetails); // ✅ update details route
router.delete('/:id', auth, deleteOrder);

module.exports = router;
