const express = require('express');
const router = express.Router();
const { auth, requireCustomer } = require('../middleware/auth'); // Fixed import

// Import controllers
const { 
  getAllTailors,
  getTailor,
  updateProfile,
  getMyOrders,
  getOrderDetails
} = require('../controllers/customerController');

// Profile routes
router.get('/profile', auth, (req, res) => {
  res.status(200).json({ 
    msg: 'Customer profile route',
    user: req.user 
  });
});

router.patch('/profile', auth, updateProfile);

// Orders routes - using auth and optionally requireCustomer for extra security
router.get('/orders', auth, requireCustomer, getMyOrders);
router.get('/orders/:id', auth, requireCustomer, getOrderDetails);

// Tailor browsing routes - these don't need authentication
router.get('/tailors', getAllTailors);
router.get('/tailors/:id', getTailor);

module.exports = router;