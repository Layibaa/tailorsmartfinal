// server/models/User.js - FIXED: Removed address field
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
    
    // Location fields
    city: {
      type: String,
      required: [true, 'Please provide a city'],
      enum: {
        values: ['Islamabad', 'Karachi', 'Lahore', 'Peshawar', 'Quetta'],
        message: 'City must be one of: Islamabad, Karachi, Lahore, Peshawar, Quetta'
      }
    },
    region: {
      type: String,
      required: function() {
        return this.city === 'Islamabad';
      },
      enum: {
        values: [
          '', null,
          'Blue Area', 'F-6', 'F-7', 'F-8', 'F-10', 
          'G-6', 'G-7', 'G-8', 'G-10', 'H-8', 'I-8', 
          'Bahria Town', 'DHA', 'Rawat', 'Tarlai', 
          'E-7', 'E-11', 'G-9', 'G-11', 'I-9', 'I-10'
        ],
        message: 'Invalid region for Islamabad'
      },
      validate: {
        validator: function(value) {
          if (this.city === 'Islamabad') {
            return value && value.trim().length > 0;
          }
          return !value || value === '';
        },
        message: 'Region is required for Islamabad, and should be empty for other cities'
      }
    },
    
    // Auth fields
    otp: String,
    otpExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    refreshToken: String,
    refreshTokenExpires: Date,
    
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || validator.isMobilePhone(v, 'en-PK');
        },
        message: 'Please provide a valid Pakistani phone number'
      }
    },
    
    // Tailor Profile
    tailorProfile: {
      shopName: String,
      shopLocation: String,
      shopAddress: String,
      averagePrice: Number,
      experience: Number,
      specialties: [String],
      specialization: String,
      rating: { type: Number, min: 0, max: 5, default: 0 },
      reviewCount: { type: Number, default: 0 },
      reviews: [{
        customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5, required: true },
        comment: String,
        date: { type: Date, default: Date.now }
      }]
    },
    
    //  FIXED: Customer Profile - removed address field
    customerProfile: {
      age: Number,
      gender: {
        type: String,
        enum: ['Male', 'Female', 'Other', 'male', 'female', 'other'] //  Accept both cases
      },
      weight: Number,
      height: Number,
      //  REMOVED: address field
      preferredStyles: [String],
      savedMeasurements: {
        chest: Number, 
        waist: Number, 
        hip: Number,
        shoulder: Number, 
        sleeveLength: Number, 
        neck: Number,
        inseam: Number, 
        outseam: Number, 
        thigh: Number
      }
    },

    lastLogin: Date,
    loginCount: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// Pre-save middleware
UserSchema.pre('save', async function() {
  // Hash password if modified
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  
  // Handle region field based on city
  if (this.isModified('city')) {
    if (this.city !== 'Islamabad') {
      this.region = null;
    }
  }
  
  //  Normalize gender to capitalized format
  if (this.customerProfile && this.customerProfile.gender) {
    const gender = this.customerProfile.gender.toLowerCase();
    if (gender === 'male') this.customerProfile.gender = 'Male';
    else if (gender === 'female') this.customerProfile.gender = 'Female';
    else if (gender === 'other') this.customerProfile.gender = 'Other';
  }
  
  // Sync shopAddress and shopLocation
  if (this.tailorProfile) {
    if (this.tailorProfile.shopLocation && !this.tailorProfile.shopAddress) {
      this.tailorProfile.shopAddress = this.tailorProfile.shopLocation;
    }
    if (this.tailorProfile.shopAddress && !this.tailorProfile.shopLocation) {
      this.tailorProfile.shopLocation = this.tailorProfile.shopAddress;
    }
  }
});

UserSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateRefreshToken = function() {
  const crypto = require('crypto');
  const token = crypto.randomBytes(32).toString('hex');
  this.refreshToken = token;
  this.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return token;
};

UserSchema.methods.clearRefreshToken = function() {
  this.refreshToken = undefined;
  this.refreshTokenExpires = undefined;
};

module.exports = mongoose.model('User', UserSchema);