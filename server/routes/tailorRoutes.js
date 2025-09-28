const express = require('express');
const router = express.Router();
const { auth, requireTailor } = require('../middleware/auth');

// Import controllers
const { 
  getProfile,
  updateProfile, 
  sendPasswordChangeOtp,
  updatePassword,
  sendDeleteAccountOtp,
  deleteAccount,
  getMyOrders, 
  getOrderDetails,
  getPendingOrders,
  getActiveOrders,
  getCompletedOrders,
   getAllTailors
} = require('../controllers/tailorController');

// Profile routes
router.get('/profile', auth, requireTailor, getProfile);
router.put('/profile', auth, requireTailor, updateProfile);

// Password management routes
router.post('/password/send-otp', auth, requireTailor, sendPasswordChangeOtp);
router.put('/password', auth, requireTailor, updatePassword);

// Account deletion routes
router.post('/delete/send-otp', auth, requireTailor, sendDeleteAccountOtp);
router.delete('/delete', auth, requireTailor, deleteAccount);

// Legacy profile route (keep for backward compatibility)
router.patch('/profile', auth, requireTailor, updateProfile);

// Orders routes - Note: specific routes should come before general ones
router.get('/orders/pending', auth, requireTailor, getPendingOrders);
router.get('/orders/active', auth, requireTailor, getActiveOrders);
router.get('/orders/completed', auth, requireTailor, getCompletedOrders);
router.get('/orders', auth, requireTailor, getMyOrders);
router.get('/orders/:id', auth, requireTailor, getOrderDetails);

router.get('/', getAllTailors);

// Tailor listing routes - these don't need authentication as they're public
router.get('/', (req, res) => {
  res.status(200).json({ msg: 'Get all tailors route' });
});

router.get('/:id', (req, res) => {
  res.status(200).json({ msg: 'Get single tailor route' });
});

module.exports = router;