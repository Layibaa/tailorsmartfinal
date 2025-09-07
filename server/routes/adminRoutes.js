// server/routes/adminRoutes.js - Enhanced with user management
const express = require('express');
const router = express.Router();
const { auth, requireAdmin, requireSuperAdmin } = require('../middleware/auth');

const { 
  getDashboardStats,
  getMetrics,
  getAllUsers,
  updateUserStatus,
  getAllCustomers,
  getAllTailors,
  getAllOrders,
  getCustomer,
  getTailor,
  getOrder
} = require('../controllers/adminController');

// All admin routes require authentication
router.use(auth);

// Dashboard endpoints
router.get('/dashboard', requireAdmin, getDashboardStats);
router.get('/metrics', requireAdmin, getMetrics);

// Enhanced User Management - NEW
router.get('/users', requireAdmin, getAllUsers);
router.patch('/users/:id/status', requireAdmin, updateUserStatus);

// Legacy user endpoints (keep for backward compatibility)
router.get('/customers', requireAdmin, getAllCustomers);
router.get('/tailors', requireAdmin, getAllTailors);
router.get('/customers/:id', requireAdmin, getCustomer);
router.get('/tailors/:id', requireAdmin, getTailor);

// Order management
router.get('/orders', requireAdmin, getAllOrders);
router.get('/orders/:id', requireAdmin, getOrder);

// Order status update endpoint
router.patch('/orders/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const Order = require('../models/Order');
    
    const validStatuses = ['pending', 'accepted', 'rejected', 'confirmed', 'making', 'payment_done', 'completed'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        msg: 'Invalid status'
      });
    }
    
    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).populate('customer tailor');
    
    if (!order) {
      return res.status(404).json({
        success: false,
        msg: 'Order not found'
      });
    }
    
    res.json({
      success: true,
      data: order,
      msg: `Order status updated to ${status}`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// System diagnostics - superadmin only
router.get('/diagnostic', requireSuperAdmin, async (req, res) => {
  try {
    const User = require('../models/User');
    const Order = require('../models/Order');
    
    const allUsers = await User.find().select('name email role status isVerified createdAt');
    
    const roleCounts = allUsers.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    const orderCount = await Order.countDocuments();
    
    res.status(200).json({
      success: true,
      data: {
        totalUsers: allUsers.length,
        roleCounts,
        orderCount,
        recentUsers: allUsers.slice(0, 5).map(user => ({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ 
      success: false, 
      msg: 'Diagnostic failed', 
      error: error.message 
    });
  }
});

// Admin whoami endpoint
router.get('/whoami', requireAdmin, (req, res) => {
  res.json({
    success: true,
    msg: 'Admin panel access confirmed',
    user: {
      id: req.user.userId,
      role: req.user.role,
      name: req.user.userObj?.name,
      email: req.user.userObj?.email
    },
    permissions: {
      canManageUsers: ['superadmin', 'admin'].includes(req.user.role),
      canManageOrders: ['superadmin', 'admin', 'support'].includes(req.user.role),
      canViewAnalytics: ['superadmin', 'admin'].includes(req.user.role),
      isSuperAdmin: req.user.role === 'superadmin'
    },
    timestamp: new Date().toISOString()
  });
});

module.exports = router;