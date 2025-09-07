// server/models/User.js - Enhanced with refresh tokens and expanded roles
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      minlength: 3,
      maxlength: 50
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      validate: {
        validator: validator.isEmail,
        message: 'Please provide a valid email'
      },
      unique: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6
    },
    role: {
      type: String,
      enum: {
        values: ['superadmin', 'admin', 'support', 'customer', 'tailor'],
        message: '{VALUE} is not supported'
      },
      default: 'customer'
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended'],
      default: 'active'
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    // Auth fields
    otp: String,
    otpExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshToken: String, // NEW: For JWT refresh
    refreshTokenExpires: Date, // NEW: Refresh token expiry
    
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || validator.isMobilePhone(v);
        },
        message: 'Please provide a valid phone number'
      }
    },
    
    // Role-specific profiles
    tailorProfile: {
      shopName: String,
      shopLocation: String,
      experience: Number,
      specialties: [String],
      rating: { type: Number, min: 0, max: 5, default: 0 },
      reviews: [{
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: String,
        date: { type: Date, default: Date.now }
      }]
    },
    
    customerProfile: {
      age: Number,
      gender: String,
      weight: Number,
      height: Number,
      address: String,
      preferredStyles: [String],
      savedMeasurements: {
        chest: Number, waist: Number, hip: Number,
        shoulder: Number, sleeveLength: Number, neck: Number,
        inseam: Number, outseam: Number, thigh: Number
      }
    },

    // Admin fields
    lastLogin: Date,
    loginCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Hash password before saving
UserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate refresh token
UserSchema.methods.generateRefreshToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.refreshToken = token;
  this.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return token;
};

// Clear refresh token
UserSchema.methods.clearRefreshToken = function() {
  this.refreshToken = undefined;
  this.refreshTokenExpires = undefined;
};

module.exports = mongoose.model('User', UserSchema);