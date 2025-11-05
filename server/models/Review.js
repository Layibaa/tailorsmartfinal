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
    // order is now OPTIONAL - allows general reviews
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
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

// Compound index to prevent duplicate reviews per customer-tailor pair
// One general review per customer per tailor (regardless of orders)
ReviewSchema.index({ customer: 1, tailor: 1 }, { 
  unique: true,
  partialFilterExpression: { order: null } // Only for general reviews
});

// Index for tailor reviews lookup
ReviewSchema.index({ tailor: 1, createdAt: -1 });
ReviewSchema.index({ tailor: 1, rating: 1 });

// Virtual for checking if review is positive (4+ stars)
ReviewSchema.virtual('isPositive').get(function() {
  return this.rating >= 4;
});

ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Review', ReviewSchema);