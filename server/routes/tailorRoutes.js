const express = require('express');
const router = express.Router();
const {
  getTailors,
  getFeaturedTailors,
  getTailorById,
  getTailorProfile,
  updateTailorProfile,
  addFeaturedWork,
  removeFeaturedWork
} = require('../controllers/tailorController');
const { protect } = require('../middleware/auth');
const { isTailor } = require('../middleware/roles');

// Public routes - no authentication required
router.get('/', getTailors);
router.get('/featured', getFeaturedTailors);
router.get('/:id', getTailorById);

// Protected routes - require authentication
router.use(protect);

// Get current tailor's profile (tailor only)
router.get('/profile', isTailor, getTailorProfile);

// Update tailor profile (tailor only)
router.put('/profile', isTailor, updateTailorProfile);

// Add featured work (tailor only)
router.post('/profile/work', isTailor, addFeaturedWork);

// Remove featured work (tailor only)
router.delete('/profile/work/:workId', isTailor, removeFeaturedWork);

module.exports = router;