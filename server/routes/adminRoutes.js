const express = require('express');
const router = express.Router();
const {
  getMetrics,
  getUsers,
  getUserById,
  updateUser,
  deleteUser
} = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roles');

// All routes are protected - require admin authentication
router.use(protect);
router.use(isAdmin);

// Get admin dashboard metrics
router.get('/metrics', getMetrics);

// User management routes
router.get('/users', getUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
