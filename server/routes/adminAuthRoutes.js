// ====================
// server/routes/adminAuthRoutes.js
// ====================
const express = require('express');
const router = express.Router();
const { adminAuth, checkPermission } = require('../middleware/adminAuth');
const auditLog = require('../middleware/auditLog');

const {
  adminLogin,
  refreshToken,
  adminLogout,
  logoutAll,
  getCurrentAdmin,
  changePassword,
  forgotPassword,
  resetPassword,
  updateProfile,
  getActivityLog
} = require('../controllers/adminAuthController');

// Rate limiting for auth routes
const rateLimit = require('express-rate-limit');

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs for auth routes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no authentication required)
router.post('/login', loginLimiter, auditLog('admin-login'), adminLogin);
router.post('/refresh', authLimiter, refreshToken);
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/reset-password/:token', authLimiter, resetPassword);

// Protected routes (require authentication)
router.use(adminAuth); // Apply authentication middleware to all routes below

router.post('/logout', auditLog('admin-logout'), adminLogout);
router.post('/logout-all', auditLog('admin-logout-all'), logoutAll);
router.get('/me', getCurrentAdmin);
router.patch('/change-password', auditLog('admin-change-password'), changePassword);
router.patch('/profile', auditLog('admin-update-profile'), updateProfile);
router.get('/activity', checkPermission('view_analytics'), getActivityLog);

// Health check for admin auth system
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin auth system is healthy',
    admin: {
      id: req.admin.id,
      role: req.admin.role
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;