const express = require('express');
const router = express.Router();
const { auth, requireCustomer } = require('../middleware/auth');

const {
  createGeneralReview,
  getTailorReviews,
  checkReviewEligibility,
  getMyReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

console.log('✅ Review routes loaded');

// Public routes (MUST BE BEFORE PROTECTED ROUTES)
router.get('/tailor/:tailorId', getTailorReviews);

// Customer routes (protected)
router.post('/tailor/:tailorId', auth, requireCustomer, createGeneralReview);
router.get('/my-reviews', auth, requireCustomer, getMyReviews);
router.get('/check-eligibility/tailor/:tailorId', auth, requireCustomer, checkReviewEligibility);
router.put('/:reviewId', auth, requireCustomer, updateReview);
router.delete('/:reviewId', auth, requireCustomer, deleteReview);

module.exports = router;