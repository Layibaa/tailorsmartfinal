// server/routes/reviewRoutes.js - REPLACE ENTIRE FILE
const express = require('express');
const router = express.Router();
const { auth, requireCustomer } = require('../middleware/auth');

const {
  createOrderReview,
  getTailorReviews,
  checkOrderReviewEligibility,
  getMyReviews,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');

console.log('✅ Review routes loaded - ORDER-BASED REVIEWS');

// ============================================
// PUBLIC ROUTES (no auth required)
// ============================================

// Get all reviews for a tailor (public)
router.get('/tailor/:tailorId', getTailorReviews);

// ============================================
// CUSTOMER ROUTES (auth + customer role required)
// ============================================

// Create review for a completed order
router.post('/order/:orderId', auth, requireCustomer, createOrderReview);

// Check if order can be reviewed
router.get('/check-eligibility/order/:orderId', auth, requireCustomer, checkOrderReviewEligibility);

// Get customer's own reviews
router.get('/my-reviews', auth, requireCustomer, getMyReviews);

// Update existing review
router.put('/:reviewId', auth, requireCustomer, updateReview);

// Delete review
router.delete('/:reviewId', auth, requireCustomer, deleteReview);

module.exports = router;