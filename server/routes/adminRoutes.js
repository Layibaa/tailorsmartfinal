// ====================
// server/routes/adminRoutes.js (Enhanced version)
// ====================
const express = require('express');
const router = express.Router();
const { adminAuth, checkPermission, checkRole } = require('../middleware/adminAuth');
const auditLog = require('../middleware/auditLog');

const { 
  getDashboardStats, 
  getSystemAnalytics,
  getAllCustomers,
  getAllTailors,
  getAllOrders,
  getCustomer,
  getTailor,
  getOrder
} = require('../controllers/adminController');

// Apply admin authentication to all routes
router.use(adminAuth);

// Dashboard and Analytics routes
router.get('/dashboard', 
  checkPermission('view_analytics'), 
  auditLog('view-dashboard'), 
  getDashboardStats
);

router.get('/analytics', 
  checkPermission('view_analytics'), 
  auditLog('view-analytics'), 
  getSystemAnalytics
);

// User management routes
router.get('/customers', 
  checkPermission('read'), 
  auditLog('view-customers'), 
  getAllCustomers
);

router.get('/customers/:id', 
  checkPermission('read'), 
  auditLog('view-customer-details'), 
  getCustomer
);

router.get('/tailors', 
  checkPermission('read'), 
  auditLog('view-tailors'), 
  getAllTailors
);

router.get('/tailors/:id', 
  checkPermission('read'), 
  auditLog('view-tailor-details'), 
  getTailor
);

// Order management routes
router.get('/orders', 
  checkPermission('manage_orders'), 
  auditLog('view-orders'), 
  getAllOrders
);

router.get('/orders/:id', 
  checkPermission('manage_orders'), 
  auditLog('view-order-details'), 
  getOrder
);

// System management routes (super admin only)
router.get('/system/stats', 
  checkRole('superadmin'), 
  auditLog('view-system-stats'), 
  (req, res) => {
    // Advanced system statistics
    res.json({
      success: true,
      message: 'System stats endpoint - implement based on needs',
      stats: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version
      }
    });
  }
);

// Health check for admin system
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Admin system is healthy',
    admin: {
      id: req.admin.id,
      role: req.admin.role,
      permissions: req.admin.permissions
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;

