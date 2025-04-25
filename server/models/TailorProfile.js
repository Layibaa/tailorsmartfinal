const mongoose = require('mongoose');

// Feature work schema
const FeaturedWorkSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  imageUrl: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Review schema
const ReviewSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  customerName: {
    type: String,
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: [500, 'Comment cannot be more than 500 characters']
  },
  date: {
    type: Date,
    default: Date.now
  }
});

const TailorProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    shopName: {
      type: String,
      required: [true, 'Please add a shop name'],
      trim: true,
      maxlength: [50, 'Shop name cannot be more than 50 characters']
    },
    location: {
      type: String,
      required: [true, 'Please add a location'],
      trim: true
    },
    priceRange: {
      type: String,
      required: [true, 'Please add a price range'],
      trim: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    experience: {
      type: String,
      trim: true
    },
    specialties: {
      type: [String],
      default: ['Shirts', 'Pants', 'Suits', 'Dresses']
    },
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot be more than 5'],
      default: 0
    },
    reviewCount: {
      type: Number,
      default: 0
    },
    featuredWork: [FeaturedWorkSchema],
    reviews: [ReviewSchema],
    isVerified: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Calculate average rating when a review is added or removed
TailorProfileSchema.methods.calculateAverageRating = async function() {
  const reviews = this.reviews;
  
  if (reviews.length === 0) {
    this.rating = 0;
    this.reviewCount = 0;
  } else {
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    this.rating = parseFloat((totalRating / reviews.length).toFixed(1));
    this.reviewCount = reviews.length;
  }
  
  await this.save();
};

module.exports = mongoose.model('TailorProfile', TailorProfileSchema);
