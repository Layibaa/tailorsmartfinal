// server/controllers/tailorController.js - FIXED duplicate exports
const User = require('../models/User');
const Order = require('../models/Order');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const validator = require('validator');

// Get tailor profile
const getProfile = async (req, res) => {
  const { userId } = req.user;
  
  const tailor = await User.findById(userId).select('-password -otp -otpExpires -passwordResetToken -passwordResetExpires -refreshToken -refreshTokenExpires');
  
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${userId}`);
  }
  
  res.status(StatusCodes.OK).json({ success: true, tailor });
};

//  FIXED: Update tailor profile with correct field names
const updateProfile = async (req, res) => {
  const { userId } = req.user;
  const { name, email, city, region, shopName, shopLocation, shopAddress, averagePrice } = req.body;
  
  console.log('📝 Updating tailor profile:', {
    userId,
    shopName,
    shopLocation,
    shopAddress,
    averagePrice
  });
  
  // Validate required fields
  if (!name || name.trim().length < 2) {
    throw new BadRequestError('Name must be at least 2 characters');
  }
  
  if (email && !validator.isEmail(email)) {
    throw new BadRequestError('Please provide a valid email');
  }
  
  if (!city) {
    throw new BadRequestError('City is required');
  }
  
  if (city === 'Islamabad' && !region) {
    throw new BadRequestError('Region is required for Islamabad');
  }
  
  if (!shopName || shopName.trim().length === 0) {
    throw new BadRequestError('Shop name is required');
  }
  
  //  Accept both shopLocation and shopAddress
  const location = shopLocation || shopAddress;
  if (!location || location.trim().length === 0) {
    throw new BadRequestError('Shop address is required');
  }
  
  if (!averagePrice || isNaN(averagePrice) || parseFloat(averagePrice) <= 0) {
    throw new BadRequestError('Valid average price is required');
  }
  
  // Check if email is already taken by another user
  if (email) {
    const existingUser = await User.findOne({ email, _id: { $ne: userId } });
    if (existingUser) {
      throw new BadRequestError('Email is already taken');
    }
  }
  
  const updateData = { 
    name: name.trim(),
    city,
    region: city === 'Islamabad' ? region : null
  };
  
  if (email) {
    updateData.email = email;
  }
  
  //  FIXED: Update tailorProfile fields with both location names
  updateData.tailorProfile = {
    shopName: shopName.trim(),
    shopLocation: location.trim(),
    shopAddress: location.trim(),   //  set both
    averagePrice: parseFloat(averagePrice)
  };
  
  console.log(' Updating with data:', updateData);
  
  const tailor = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -otp -otpExpires -passwordResetToken -passwordResetExpires -refreshToken -refreshTokenExpires');
  
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${userId}`);
  }
  
  console.log(' Updated tailor profile:', tailor.tailorProfile);
  
  res.status(StatusCodes.OK).json({ 
    success: true, 
    message: 'Profile updated successfully',
    tailor 
  });
};

// Send OTP for password change
const sendPasswordChangeOtp = async (req, res) => {
  const { userId } = req.user;
  
  const tailor = await User.findById(userId);
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${userId}`);
  }
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  
  tailor.otp = otp;
  tailor.otpExpires = otpExpires;
  await tailor.save();
  
  console.log(`Password change OTP for ${tailor.email}: ${otp}`);
  
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'OTP sent to your email for password change'
  });
};

// Update password with OTP verification
const updatePassword = async (req, res) => {
  const { userId } = req.user;
  const { otp, newPassword } = req.body;
  
  if (!otp || otp.length !== 6) {
    throw new BadRequestError('Valid 6-digit OTP is required');
  }
  
  if (!newPassword || newPassword.length < 6) {
    throw new BadRequestError('Password must be at least 6 characters');
  }
  
  const tailor = await User.findById(userId);
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${userId}`);
  }
  
  if (!tailor.otp || tailor.otp !== otp || new Date() > tailor.otpExpires) {
    throw new BadRequestError('Invalid or expired OTP');
  }
  
  const salt = await bcrypt.genSalt(10);
  tailor.password = await bcrypt.hash(newPassword, salt);
  tailor.otp = undefined;
  tailor.otpExpires = undefined;
  
  await tailor.save();
  
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Password updated successfully'
  });
};

// Send OTP for account deletion
const sendDeleteAccountOtp = async (req, res) => {
  const { userId } = req.user;
  
  const tailor = await User.findById(userId);
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${userId}`);
  }
  
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
  
  tailor.otp = otp;
  tailor.otpExpires = otpExpires;
  await tailor.save();
  
  console.log(`Account deletion OTP for ${tailor.email}: ${otp}`);
  
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'OTP sent to your email for account deletion'
  });
};

// Delete account with OTP verification
const deleteAccount = async (req, res) => {
  const { userId } = req.user;
  const { otp } = req.body;
  
  if (!otp || otp.length !== 6) {
    throw new BadRequestError('Valid 6-digit OTP is required');
  }
  
  const tailor = await User.findById(userId);
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${userId}`);
  }
  
  if (!tailor.otp || tailor.otp !== otp || new Date() > tailor.otpExpires) {
    throw new BadRequestError('Invalid or expired OTP');
  }
  
  await Order.deleteMany({ tailor: userId });
  await User.findByIdAndDelete(userId);
  
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Account deleted successfully'
  });
};

// Get tailor's orders
const getMyOrders = async (req, res) => {
  const { userId } = req.user;
  
  const orders = await Order.find({ tailor: userId })
    .populate('customer', 'name customerProfile')
    .sort('-createdAt');
  
  res.status(StatusCodes.OK).json({ count: orders.length, orders });
};

// Get single order details
const getOrderDetails = async (req, res) => {
  const { userId } = req.user;
  const { id: orderId } = req.params;
  
  const order = await Order.findOne({
    _id: orderId,
    tailor: userId
  }).populate('customer', 'name customerProfile');
  
  if (!order) {
    throw new NotFoundError(`No order with id ${orderId}`);
  }
  
  res.status(StatusCodes.OK).json({ order });
};

// Get pending order requests
const getPendingOrders = async (req, res) => {
  const { userId } = req.user;
  
  const orders = await Order.find({ 
    tailor: userId,
    status: 'pending'
  }).populate('customer', 'name customerProfile');
  
  res.status(StatusCodes.OK).json({ count: orders.length, orders });
};

// Get active orders
const getActiveOrders = async (req, res) => {
  const { userId } = req.user;
  
  const orders = await Order.find({ 
    tailor: userId,
    status: { $in: ['accepted', 'confirmed', 'making', 'payment_done'] }
  }).populate('customer', 'name customerProfile');
  
  res.status(StatusCodes.OK).json({ count: orders.length, orders });
};

// Get completed orders
const getCompletedOrders = async (req, res) => {
  const { userId } = req.user;
  
  const orders = await Order.find({ 
    tailor: userId,
    status: 'completed'
  }).populate('customer', 'name customerProfile');
  
  res.status(StatusCodes.OK).json({ count: orders.length, orders });
};

// Get all tailors with optional city/region filtering
const getAllTailors = async (req, res) => {
  const { city, region } = req.query;
  
  try {
    let filter = { role: 'tailor', status: 'active' };
    
    if (city) {
      filter.city = city;
    }
    
    if (region && city === 'Islamabad') {
      filter.region = region;
    }
    
    const tailors = await User.find(filter)
      .select('name email city region tailorProfile createdAt')
      .sort('-createdAt');
    
    res.status(StatusCodes.OK).json({
      success: true,
      count: tailors.length,
      tailors
    });
  } catch (error) {
    console.error('Get all tailors error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch tailors'
    });
  }
};

//  REMOVED: Duplicate updateProfileOld function

module.exports = {
  getProfile,
  updateProfile,
  sendPasswordChangeOtp,
  updatePassword,
  sendDeleteAccountOtp,
  deleteAccount,
  getMyOrders,
  getOrderDetails,
  getPendingOrders,
  getActiveOrders,
  getCompletedOrders,
  getAllTailors
};