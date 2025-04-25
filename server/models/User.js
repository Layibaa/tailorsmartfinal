const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Base schema options for all users
const baseOptions = {
  discriminatorKey: 'role',
  collection: 'users',
};

// Base User Schema
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: function () {
        return this.role !== 'admin'; // only required for non-admins
      },
      unique: true,
      trim: true,
    },
    mobileNumber: {
      type: String,
      required: false, // Changed to optional
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  baseOptions
);

// Customer Schema
const customerSchema = new mongoose.Schema({
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true,
  },
  age: {
    type: Number,
    required: true,
  },
  height: {
    type: Number,
    required: true,
  },
  weight: {
    type: Number,
    required: true,
  },
});

// Tailor Schema
const tailorSchema = new mongoose.Schema({
  shopName: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  priceRange: {
    min: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
  },
});

// Admin Schema
const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
});

// Method to check if password matches
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Create the base User model
const User = mongoose.model('User', userSchema);

// Create discriminator models
const Customer = User.discriminator('customer', customerSchema);
const Tailor = User.discriminator('tailor', tailorSchema);
const Admin = User.discriminator('admin', adminSchema);

module.exports = { User, Customer, Tailor, Admin };
