const mongoose = require('mongoose');

const TailorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Please provide your full name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  shopName: {
    type: String,
    required: [true, 'Please provide your shop name'],
    trim: true
  },
  shopLocation: {
    type: String,
    required: [true, 'Please provide your shop location'],
    trim: true
  },
  averagePriceRange: {
    type: String,
    required: [true, 'Please provide your average price range'],
    trim: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Tailor', TailorSchema);
