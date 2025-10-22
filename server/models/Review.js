// server/models/Review.js - REPLACE THE ENTIRE FILE
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
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: [true, 'Order ID is required'],
      unique: true // One review per order
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment cannot exceed 500 characters'],
      trim: true
    },
    images: [{
      type: String, // Store image URLs or paths
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

// Indexes for better query performance
ReviewSchema.index({ customer: 1, order: 1 }, { unique: true });
ReviewSchema.index({ tailor: 1, createdAt: -1 });
ReviewSchema.index({ tailor: 1, rating: 1 });

// Virtual for checking if review is positive (4+ stars)
ReviewSchema.virtual('isPositive').get(function() {
  return this.rating >= 4;
});

ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Review', ReviewSchema);