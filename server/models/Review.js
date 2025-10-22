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
      unique: true
    },
    rating: {
      type: String,
      enum: {
        values: ['positive', 'negative'],
        message: '{VALUE} is not a valid rating type'
      },
      required: [true, 'Rating is required']
    },
    comment: {
      type: String,
      maxlength: [200, 'Comment cannot exceed 200 characters'],
      trim: true
    },
    isVisible: {
      type: Boolean,
      default: true
    }
  },
  { 
    timestamps: true 
  }
);

ReviewSchema.index({ customer: 1, order: 1 }, { unique: true });
ReviewSchema.index({ tailor: 1, createdAt: -1 });

ReviewSchema.virtual('isPositive').get(function() {
  return this.rating === 'positive';
});

ReviewSchema.set('toJSON', { virtuals: true });
ReviewSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Review', ReviewSchema);