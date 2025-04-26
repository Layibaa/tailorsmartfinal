const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Customer Signup
router.post('/customer/signup', authController.registerCustomer);

// Tailor Signup
router.post('/tailor/signup', authController.registerTailor);

// Verify OTP
router.post('/verify-otp', authController.verifyOtp);

// Login (Customer & Tailor)
router.post('/login', authController.login);

// Admin Login
router.post('/admin/login', authController.adminLogin);

// Forgot Password
router.post('/forgot-password', authController.forgotPassword);

// Reset Password
router.post('/reset-password', authController.resetPassword);

module.exports = router;
