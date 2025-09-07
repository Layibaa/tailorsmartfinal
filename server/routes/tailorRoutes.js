const express = require('express');
const router = express.Router();
const { auth, requireTailor } = require('../middleware/auth'); // Fixed import

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
router.get('/profile', auth, requireTailor, (req, res) => {
  res.status(200).json({ 
    msg: 'Tailor profile route',
    user: req.user 
  });
});

router.patch('/profile', auth, requireTailor, updateProfile);

// Orders routes - Note: specific routes should come before general ones
router.get('/orders/pending', auth, requireTailor, getPendingOrders);
router.get('/orders/active', auth, requireTailor, getActiveOrders);
router.get('/orders/completed', auth, requireTailor, getCompletedOrders);
router.get('/orders', auth, requireTailor, getMyOrders);
router.get('/orders/:id', auth, requireTailor, getOrderDetails);

// Tailor listing routes - these don't need authentication as they're public
router.get('/', (req, res) => {
  res.status(200).json({ msg: 'Get all tailors route' });
});

router.get('/:id', (req, res) => {
  res.status(200).json({ msg: 'Get single tailor route' });
});

module.exports = router;