// ====================
// server/models/Admin.js
// ====================
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      minlength: 2,
      maxlength: 50,
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      validate: {
        validator: validator.isEmail,
        message: 'Please provide a valid email'
      },
      unique: true,
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6
    },
    role: {
      type: String,
      enum: {
        values: ['admin', 'superadmin'],
        message: '{VALUE} is not supported'
      },
      default: 'admin'
    },
    permissions: [{
      type: String,
      enum: ['read', 'write', 'delete', 'manage_users', 'manage_orders', 'view_analytics']
    }],
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: Date,
    refreshTokens: [String],
    passwordResetToken: String,
    passwordResetExpires: Date,
    loginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: Date
  },
  { timestamps: true }
);

// Hash password before saving
AdminSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

// Set default permissions based on role
AdminSchema.pre('save', function() {
  if (this.isModified('role')) {
    if (this.role === 'superadmin') {
      this.permissions = ['read', 'write', 'delete', 'manage_users', 'manage_orders', 'view_analytics'];
    } else {
      this.permissions = ['read', 'write', 'manage_orders', 'view_analytics'];
    }
  }
});

// Compare password method
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT tokens
AdminSchema.methods.generateTokens = function() {
  const accessToken = jwt.sign(
    { 
      id: this._id, 
      role: this.role, 
      permissions: this.permissions 
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );

  const refreshToken = jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Check if admin is locked
AdminSchema.methods.isLocked = function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// Increment login attempts
AdminSchema.methods.incLoginAttempts = function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts + 1 >= 5 && !this.isLocked()) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
AdminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

module.exports = mongoose.model('Admin', AdminSchema);