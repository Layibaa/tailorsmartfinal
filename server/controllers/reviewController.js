// server/controllers/reviewController.js - REPLACE ENTIRE FILE
const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

// ============================================
// CREATE REVIEW FOR COMPLETED ORDER
// ============================================
const createOrderReview = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;
    const { orderId } = req.params;
    const { rating, comment, images } = req.body;

    console.log('⭐ Creating review for order:', orderId, 'by user:', userId);

    // Check if user is a customer
    if (role !== 'customer') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: 'Only customers can create reviews'
      });
    }

    // Validate rating
    if (!rating || rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Rating must be an integer between 1 and 5'
      });
    }

    // Validate comment
    if (!comment || comment.trim().length < 10) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Comment must be at least 10 characters'
      });
    }

    // Validate images
    if (images && (!Array.isArray(images) || images.length > 3)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'You can upload maximum 3 images'
      });
    }

    // ✅ CHECK ORDER EXISTS AND BELONGS TO CUSTOMER
    const order = await Order.findById(orderId).populate('tailor', 'name');
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Order not found'
      });
    }

    // ✅ CHECK ORDER BELONGS TO THIS CUSTOMER
    if (order.customer.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: 'You can only review your own orders'
      });
    }

    // ✅ CHECK ORDER IS COMPLETED
    if (order.status !== 'completed') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'You can only review completed orders',
        currentStatus: order.status
      });
    }

    // ✅ CHECK IF REVIEW ALREADY EXISTS FOR THIS ORDER
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'You have already reviewed this order'
      });
    }

    // ✅ CREATE REVIEW
    const review = await Review.create({
      customer: userId,
      tailor: order.tailor._id,
      order: orderId,
      rating: parseInt(rating),
      comment: comment.trim(),
      images: images || []
    });

    // ✅ UPDATE TAILOR'S AVERAGE RATING
    await updateTailorReviewStats(order.tailor._id);

    await review.populate([
      { path: 'customer', select: 'name' },
      { path: 'tailor', select: 'name' },
      { path: 'order', select: 'suitType createdAt' }
    ]);

    console.log('✅ Review created successfully');

    res.status(StatusCodes.CREATED).json({
      success: true,
      msg: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('❌ Create order review error:', error);
    
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

// ============================================
// GET ALL REVIEWS FOR A TAILOR
// ============================================
const getTailorReviews = async (req, res) => {
  try {
    const { tailorId } = req.params;

    console.log('📊 Fetching reviews for tailor:', tailorId);

    const tailor = await User.findById(tailorId);
    if (!tailor || tailor.role !== 'tailor') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Tailor not found'
      });
    }

    const reviews = await Review.find({ 
      tailor: tailorId,
      isVisible: true 
    })
      .populate('customer', 'name')
      .populate('order', 'suitType createdAt')
      .sort({ createdAt: -1 });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
      : 0;

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
    console.error('❌ Get tailor reviews error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching reviews'
    });
  }
};

// ============================================
// CHECK IF ORDER CAN BE REVIEWED
// ============================================
const checkOrderReviewEligibility = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { orderId } = req.params;

    console.log('🔍 Checking review eligibility for order:', orderId);

    const order = await Order.findById(orderId).populate('tailor', 'name');
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Order not found'
      });
    }

    // Check if order belongs to this customer
    if (order.customer.toString() !== userId) {
      return res.json({
        success: true,
        eligible: false,
        reason: 'This is not your order'
      });
    }

    // Check if order is completed
    if (order.status !== 'completed') {
      return res.json({
        success: true,
        eligible: false,
        reason: 'Order must be completed before reviewing',
        currentStatus: order.status
      });
    }

    // Check if already reviewed
    const existingReview = await Review.findOne({ order: orderId });
    if (existingReview) {
      return res.json({
        success: true,
        eligible: false,
        reason: 'You have already reviewed this order',
        review: existingReview
      });
    }

    res.json({
      success: true,
      eligible: true,
      order: {
        _id: order._id,
        suitType: order.suitType,
        tailor: {
          _id: order.tailor._id,
          name: order.tailor.name
        }
      }
    });
  } catch (error) {
    console.error('❌ Check review eligibility error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while checking eligibility'
    });
  }
};

// ============================================
// GET CUSTOMER'S OWN REVIEWS
// ============================================
const getMyReviews = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;

    console.log('📋 Fetching reviews for customer:', userId);

    const reviews = await Review.find({ customer: userId })
      .populate('tailor', 'name tailorProfile')
      .populate('order', 'suitType createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    console.error('❌ Get my reviews error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching reviews'
    });
  }
};

// ============================================
// UPDATE REVIEW
// ============================================
const updateReview = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;

    console.log('📝 Updating review:', reviewId);

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Review not found'
      });
    }

    if (review.customer.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: 'You can only update your own reviews'
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          msg: 'Rating must be an integer between 1 and 5'
        });
      }
      review.rating = rating;
    }

    if (comment !== undefined) {
      if (comment.trim().length < 10) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          msg: 'Comment must be at least 10 characters'
        });
      }
      review.comment = comment.trim();
    }

    if (images !== undefined) {
      if (!Array.isArray(images) || images.length > 3) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          msg: 'You can upload maximum 3 images'
        });
      }
      review.images = images;
    }

    await review.save();

    if (rating !== undefined) {
      await updateTailorReviewStats(review.tailor);
    }

    await review.populate([
      { path: 'customer', select: 'name' },
      { path: 'tailor', select: 'name' },
      { path: 'order', select: 'suitType createdAt' }
    ]);

    res.json({
      success: true,
      msg: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('❌ Update review error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while updating review'
    });
  }
};

// ============================================
// DELETE REVIEW
// ============================================
const deleteReview = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { reviewId } = req.params;

    console.log('🗑️ Deleting review:', reviewId);

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Review not found'
      });
    }

    if (review.customer.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: 'You can only delete your own reviews'
      });
    }

    const tailorId = review.tailor;
    await Review.findByIdAndDelete(reviewId);
    await updateTailorReviewStats(tailorId);

    res.json({
      success: true,
      msg: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete review error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while deleting review'
    });
  }
};

// ============================================
// HELPER: UPDATE TAILOR STATS
// ============================================
const updateTailorReviewStats = async (tailorId) => {
  try {
    const reviews = await Review.find({ tailor: tailorId, isVisible: true });
    
    const totalCount = reviews.length;
    const averageRating = totalCount > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalCount
      : 0;

    await User.findByIdAndUpdate(tailorId, {
      'tailorProfile.rating': parseFloat(averageRating.toFixed(1)),
      'tailorProfile.reviewCount': totalCount
    });

    console.log('✅ Updated tailor stats:', { tailorId, averageRating, totalCount });
  } catch (error) {
    console.error('❌ Update tailor stats error:', error);
  }
};

module.exports = {
  createOrderReview,
  getTailorReviews,
  checkOrderReviewEligibility,
  getMyReviews,
  updateReview,
  deleteReview
};