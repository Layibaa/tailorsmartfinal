// server/controllers/reviewController.js - REPLACE THE ENTIRE FILE
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

// Create a review (customer only)
const createReview = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;
    const { orderId, rating, comment, images } = req.body;

    // Verify customer role
    if (role !== 'customer') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: 'Only customers can create reviews'
      });
    }

    // Validate required fields
    if (!orderId || !rating) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Order ID and rating are required'
      });
    }

    // Validate rating value (1-5)
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Rating must be an integer between 1 and 5'
      });
    }

    // Validate images array (max 3)
    if (images && (!Array.isArray(images) || images.length > 3)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'You can upload maximum 3 images'
      });
    }

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Order not found'
      });
    }

    // Verify order belongs to customer
    if (order.customer.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: 'You can only review your own orders'
      });
    }

    // Verify order is completed
    if (order.status !== 'completed') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'You can only review completed orders'
      });
    }

    // Check if review already exists for this order
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'You have already reviewed this order'
      });
    }

    // Create the review
    const review = await Review.create({
      customer: userId,
      tailor: order.tailor,
      order: orderId,
      rating: parseInt(rating),
      comment: comment?.trim() || '',
      images: images || []
    });

    // Update tailor's review stats
    await updateTailorReviewStats(order.tailor);

    // Populate review data
    await review.populate([
      { path: 'customer', select: 'name' },
      { path: 'tailor', select: 'name' },
      { path: 'order', select: 'garmentType' }
    ]);

    res.status(StatusCodes.CREATED).json({
      success: true,
      msg: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'You have already reviewed this order'
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while creating review',
      error: error.message
    });
  }
};

// Get reviews for a specific tailor
const getTailorReviews = async (req, res) => {
  try {
    const { tailorId } = req.params;

    // Verify tailor exists
    const tailor = await User.findById(tailorId);
    if (!tailor || tailor.role !== 'tailor') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Tailor not found'
      });
    }

    // Get all reviews for the tailor
    const reviews = await Review.find({ 
      tailor: tailorId,
      isVisible: true 
    })
      .populate('customer', 'name')
      .populate('order', 'garmentType')
      .sort({ createdAt: -1 });

    // Calculate stats
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;

    // Rating distribution
    const ratingDistribution = {
      5: reviews.filter(r => r.rating === 5).length,
      4: reviews.filter(r => r.rating === 4).length,
      3: reviews.filter(r => r.rating === 3).length,
      2: reviews.filter(r => r.rating === 2).length,
      1: reviews.filter(r => r.rating === 1).length
    };

    res.json({
      success: true,
      stats: {
        total: totalReviews,
        averageRating: parseFloat(averageRating),
        ratingDistribution
      },
      reviews
    });
  } catch (error) {
    console.error('Get tailor reviews error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching reviews'
    });
  }
};

// Check if customer can review an order
const checkReviewEligibility = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { orderId } = req.params;

    // Find the order
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Order not found'
      });
    }

    // Check if order belongs to customer
    if (order.customer.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        eligible: false,
        reason: 'Not your order'
      });
    }

    // Check if order is completed
    if (order.status !== 'completed') {
      return res.json({
        success: true,
        eligible: false,
        reason: 'Order not completed yet'
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.json({
        success: true,
        eligible: false,
        reason: 'Already reviewed',
        review: existingReview
      });
    }

    res.json({
      success: true,
      eligible: true,
      order: {
        _id: order._id,
        garmentType: order.garmentType,
        tailorId: order.tailor
      }
    });
  } catch (error) {
    console.error('Check review eligibility error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while checking eligibility'
    });
  }
};

// Get customer's reviews
const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    const reviews = await Review.find({ customer: userId })
      .populate('tailor', 'name tailorProfile')
      .populate('order', 'garmentType')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('Get my reviews error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching reviews'
    });
  }
};

// Helper function to update tailor's review statistics
const updateTailorReviewStats = async (tailorId) => {
  try {
    const reviews = await Review.find({ tailor: tailorId, isVisible: true });
    
    const totalCount = reviews.length;
    const averageRating = totalCount > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
      : 0;

    // Update tailor profile
    await User.findByIdAndUpdate(tailorId, {
      'tailorProfile.rating': parseFloat(averageRating.toFixed(1)),
      'tailorProfile.reviewCount': totalCount
    });
  } catch (error) {
    console.error('Update tailor review stats error:', error);
  }
};

// Delete a review (customer only, their own review)
const deleteReview = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Review not found'
      });
    }

    // Verify ownership
    if (review.customer.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: 'You can only delete your own reviews'
      });
    }

    await Review.findByIdAndDelete(reviewId);

    // Update tailor stats
    await updateTailorReviewStats(review.tailor);

    res.json({
      success: true,
      msg: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while deleting review'
    });
  }
};

module.exports = {
  createReview,
  getTailorReviews,
  checkReviewEligibility,
  getMyReviews,
  deleteReview
};