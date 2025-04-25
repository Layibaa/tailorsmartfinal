const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect, checkRole } = require('../middlewares/authMiddleware');

// Public routes
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/admin-login', authController.adminLogin);
router.post('/verify-otp', authController.verifyOTP);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Debug routes - should be removed or secured in production
router.post('/debug-format', authController.debugMobileFormat);
router.get('/debug-users', authController.debugListUsers);
router.post('/test-sms', authController.testSMS);
router.get('/check-twilio', authController.checkTwilio);
router.post('/test-email', authController.testEmail);
router.get('/check-sendgrid', authController.checkSendGrid);

// Protected routes
router.get('/profile', protect, authController.getUserProfile);
router.put('/profile', protect, authController.updateUserProfile);

// Role-specific routes
router.get(
  '/customer-data',
  protect,
  checkRole(['customer', 'admin']),
  authController.getCustomerData
);

router.get(
  '/tailor-data',
  protect,
  checkRole(['tailor', 'admin']),
  authController.getTailorData
);

module.exports = router;
