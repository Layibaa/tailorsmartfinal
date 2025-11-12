// server/models/Review.js - REPLACE ENTIRE FILE
const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer ID is required']
    },
    tailor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Tailor ID is required']
    },
    // ✅ ORDER IS NOW REQUIRED - reviews are tied to orders
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required']
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      required: [true, 'Comment is required'],
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true
    },
    images: [{
      type: String,
      validate: {
        validator: function(v) {
          return this.images.length <= 3;
        },
        message: 'Cannot upload more than 3 images'
      }
    }],
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true 
  }
);

// ✅ ONE REVIEW PER ORDER (prevents duplicate reviews for same order)
ReviewSchema.index({ order: 1 }, { unique: true });

// Index for tailor reviews lookup (show all reviews on tailor profile)
ReviewSchema.index({ tailor: 1, createdAt: -1 });
ReviewSchema.index({ tailor: 1, rating: 1 });

// Index for customer reviews
ReviewSchema.index({ customer: 1, createdAt: -1 });

// Virtual for checking if review is positive (4+ stars)
ReviewSchema.virtual('isPositive').get(function() {
  return this.rating >= 4;
});

ReviewSchema.set('toJSON', { virticals: true });
ReviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Review', ReviewSchema);