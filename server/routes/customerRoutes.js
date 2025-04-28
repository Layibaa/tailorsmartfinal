const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

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
  res.status(200).json({ msg: 'Customer profile route' });
});

router.patch('/profile', auth, updateProfile);

// Orders routes
router.get('/orders', auth, getMyOrders);
router.get('/orders/:id', auth, getOrderDetails);

// Tailor browsing routes
router.get('/tailors', getAllTailors);
router.get('/tailors/:id', getTailor);

module.exports = router;