const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  verifyOtp, 
  resendOtp, 
  forgotPassword, 
  resetPassword,
  getCurrentUser,
  updatePassword
} = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', auth, getCurrentUser);
router.post('/update-password', auth, updatePassword);

module.exports = router;