const express = require('express');
const router = express.Router();
const { auth, requireCustomer } = require('../middleware/auth');

// Import controllers
const { 
  getAllTailors,
  getTailor,
  getProfile,
  updateProfile,
  sendPasswordChangeOtp,
  updatePassword,
  sendDeleteAccountOtp,
  deleteAccount,
  getMyOrders,
  getOrderDetails
} = require('../controllers/customerController');

// Profile routes
router.get('/profile', auth, requireCustomer, getProfile);
router.put('/profile', auth, requireCustomer, updateProfile);

// Password change routes
router.post('/password/send-otp', auth, requireCustomer, sendPasswordChangeOtp);
router.put('/password', auth, requireCustomer, updatePassword);

// Account deletion routes
router.post('/delete/send-otp', auth, requireCustomer, sendDeleteAccountOtp);
router.delete('/delete', auth, requireCustomer, deleteAccount);

// Orders routes
router.get('/orders', auth, requireCustomer, getMyOrders);
router.get('/orders/:id', auth, requireCustomer, getOrderDetails);

// Tailor browsing routes - these don't need authentication
router.get('/tailors', getAllTailors);
router.get('/tailors/:id', getTailor);

module.exports = router;