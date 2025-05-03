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
// Add this to your admin routes
router.get('/diagnostic', auth, isAdmin, async (req, res) => {
  try {
    // Get all users
    const allUsers = await User.find().select('name email role isVerified createdAt');
    
    // Count by role
    const customerCount = allUsers.filter(user => user.role === 'customer').length;
    const tailorCount = allUsers.filter(user => user.role === 'tailor').length;
    const adminCount = allUsers.filter(user => user.role === 'admin').length;
    
    // Get order count
    const orderCount = await Order.countDocuments();
    
    res.status(200).json({
      totalUsers: allUsers.length,
      customerCount,
      tailorCount,
      adminCount,
      orderCount,
      users: allUsers.map(user => ({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;