const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Import controllers with the correct names
const { 
  getDashboardStats, 
  getAllCustomers,  // Changed from getAllUsers
  getAllTailors,    // This wasn't being used before
  getAllOrders,
  getCustomer,      // This wasn't being used before
  getTailor,        // This wasn't being used before
  getOrder          // This wasn't being used before
} = require('../controllers/adminController');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ msg: 'Access denied. Admin only.' });
  }
};

// Connect routes to controller functions with correct names
router.get('/dashboard', auth, isAdmin, getDashboardStats);
router.get('/customers', auth, isAdmin, getAllCustomers);  // Changed from users to customers
router.get('/tailors', auth, isAdmin, getAllTailors);      // Added this route
router.get('/orders', auth, isAdmin, getAllOrders);
router.get('/customers/:id', auth, isAdmin, getCustomer);  // Added this route
router.get('/tailors/:id', auth, isAdmin, getTailor);      // Added this route
router.get('/orders/:id', auth, isAdmin, getOrder);        // Added this route

module.exports = router;