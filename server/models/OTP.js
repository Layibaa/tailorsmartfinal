const mongoose = require('mongoose');

const OtpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  otp: {
    type: String,
    required: [true, 'OTP is required']
  },
  type: {
    type: String,
    enum: ['verification', 'reset'],
    required: [true, 'OTP type is required']
  },
  expiresAt: {
    type: Date,
    required: [true, 'Expiry time is required']
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Automatically delete documents after 10 minutes (600 seconds)
  }
});

module.exports = mongoose.model('Otp', OtpSchema);
