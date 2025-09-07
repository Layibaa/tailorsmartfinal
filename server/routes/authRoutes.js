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
  updatePassword,
  getProfile,        // New method
  updateProfile      // New method
} = require('../controllers/authController');
const auth = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// New routes for profile management
router.get('/me', getCurrentUser, getProfile);
router.patch('/profile', getCurrentUser, updateProfile);

// Protected routes
router.get('/me', auth, getCurrentUser);
router.post('/update-password', auth, updatePassword);

router.get('/me', getCurrentUser, getProfile);
router.patch('/profile', getCurrentUser, updateProfile);

module.exports = router;