const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import controllers
const { 
  updateProfile, 
  getMyOrders, 
  getOrderDetails,
  getPendingOrders,
  getActiveOrders,
  getCompletedOrders
} = require('../controllers/tailorController');

// Profile routes
router.get('/profile', auth, (req, res) => {
  res.status(200).json({ msg: 'Tailor profile route' });
});

router.patch('/profile', auth, updateProfile);

// Orders routes
router.get('/orders/pending', auth, getPendingOrders);
router.get('/orders/active', auth, getActiveOrders);
router.get('/orders/completed', auth, getCompletedOrders);
router.get('/orders', auth, getMyOrders);
router.get('/orders/:id', auth, getOrderDetails);

// Tailor listing routes
router.get('/', (req, res) => {
  res.status(200).json({ msg: 'Get all tailors route' });
});

router.get('/:id', (req, res) => {
  res.status(200).json({ msg: 'Get single tailor route' });
});

module.exports = router;