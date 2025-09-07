const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  verifyOtp, 
  resendOtp, 
  forgotPassword, 
  resetPassword,
  updatePassword,
  getProfile,
  updateProfile,
  refreshToken,
  logout,
  whoami,
} = require('../controllers/authController');
const { auth } = require('../middleware/auth'); // Fixed: destructure auth from the middleware object

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh', refreshToken);
router.post('/logout', logout);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/me', auth, getProfile);              
router.patch('/profile', auth, updateProfile);    
router.post('/update-password', auth, updatePassword);
router.get('/whoami', auth, whoami);              

module.exports = router;