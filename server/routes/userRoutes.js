const express = require('express');
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  updateUserSettings,
  changePassword,
  deleteAccount
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// All routes are protected - require authentication
router.use(protect);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);

// User settings routes
router.put('/settings', updateUserSettings);

// Password change route
router.put('/password', changePassword);

// Account deletion route
router.delete('/account', deleteAccount);

module.exports = router;
