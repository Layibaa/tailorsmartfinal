const Review = require('../models/Review');
const Order = require('../models/Order');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

// Create a general review for a tailor (no order required)
const createGeneralReview = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { role } = req.user;
    const { tailorId } = req.params;
    const { rating, comment, images } = req.body;

    if (role !== 'customer') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: 'Only customers can create reviews'
      });
    }

    if (!rating) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Rating is required'
      });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Rating must be an integer between 1 and 5'
      });
    }

    if (images && (!Array.isArray(images) || images.length > 3)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'You can upload maximum 3 images'
      });
    }

    const tailor = await User.findById(tailorId);
    if (!tailor || tailor.role !== 'tailor') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Tailor not found'
      });
    }

    const existingReview = await Review.findOne({ 
      customer: userId, 
      tailor: tailorId,
      order: { $exists: false }
    });

    if (existingReview) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'You have already reviewed this tailor'
      });
    }

    const review = await Review.create({
      customer: userId,
      tailor: tailorId,
      rating: parseInt(rating),
      comment: comment?.trim() || '',
      images: images || []
    });

    await updateTailorReviewStats(tailorId);

    await review.populate([
      { path: 'customer', select: 'name' },
      { path: 'tailor', select: 'name' }
    ]);

    res.status(StatusCodes.CREATED).json({
      success: true,
      msg: 'Review submitted successfully',
      review
    });
  } catch (error) {
    console.error('Create general review error:', error);
    
    if (error.code === 11000) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'You have already reviewed this tailor'
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while creating review',
      error: error.message
    });
  }
};

const getTailorReviews = async (req, res) => {
  try {
    const { tailorId } = req.params;

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
      .populate('order', 'garmentType')
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
    console.error('Get tailor reviews error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching reviews'
    });
  }
};

const checkReviewEligibility = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { tailorId } = req.params;

    const tailor = await User.findById(tailorId);
    if (!tailor || tailor.role !== 'tailor') {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Tailor not found'
      });
    }

    const existingReview = await Review.findOne({ 
      customer: userId, 
      tailor: tailorId,
      order: { $exists: false }
    });

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
      tailor: {
        _id: tailor._id,
        name: tailor.name
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

const updateReview = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { reviewId } = req.params;
    const { rating, comment, images } = req.body;

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
      { path: 'order', select: 'garmentType' }
    ]);

    res.json({
      success: true,
      msg: 'Review updated successfully',
      review
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while updating review'
    });
  }
};

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

    if (review.customer.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: 'You can only delete your own reviews'
      });
    }

    await Review.findByIdAndDelete(reviewId);
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
  } catch (error) {
    console.error('Update tailor review stats error:', error);
  }
};

module.exports = {
  createGeneralReview,
  getTailorReviews,
  checkReviewEligibility,
  getMyReviews,
  updateReview,
  deleteReview
};