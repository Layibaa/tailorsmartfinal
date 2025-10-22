const express = require('express');
const router = express.Router();
const { auth, requireCustomer } = require('../middleware/auth');

const {
  createReview,
  getTailorReviews,
  checkReviewEligibility,
  getMyReviews,
  deleteReview
} = require('../controllers/reviewController');

// Customer routes (protected)
router.post('/', auth, requireCustomer, createReview);
router.get('/my-reviews', auth, requireCustomer, getMyReviews);
router.get('/check-eligibility/:orderId', auth, requireCustomer, checkReviewEligibility);
router.delete('/:reviewId', auth, requireCustomer, deleteReview);

// Public routes
router.get('/tailor/:tailorId', getTailorReviews);

module.exports = router;