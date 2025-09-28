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

// Update tailor profile (except password)
const updateProfile = async (req, res) => {
  const { userId } = req.user;
  const { name, email, city, region, shopName, shopLocation, averagePrice } = req.body;
  
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
  
  if (!shopLocation || shopLocation.trim().length === 0) {
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
  
  // Update tailorProfile fields
  updateData.tailorProfile = {
    shopName: shopName.trim(),
    shopLocation: shopLocation.trim(),
    averagePrice: parseFloat(averagePrice)
  };
  
  const tailor = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password -otp -otpExpires -passwordResetToken -passwordResetExpires -refreshToken -refreshTokenExpires');
  
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${userId}`);
  }
  
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
  
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  tailor.otp = otp;
  tailor.otpExpires = otpExpires;
  await tailor.save();
  
  // In production, send email here
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
  
  // Check OTP
  if (!tailor.otp || tailor.otp !== otp || new Date() > tailor.otpExpires) {
    throw new BadRequestError('Invalid or expired OTP');
  }
  
  // Update password
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
  
  // Generate OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  tailor.otp = otp;
  tailor.otpExpires = otpExpires;
  await tailor.save();
  
  // In production, send email here
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
  
  // Check OTP
  if (!tailor.otp || tailor.otp !== otp || new Date() > tailor.otpExpires) {
    throw new BadRequestError('Invalid or expired OTP');
  }
  
  // Delete all orders related to this tailor
  await Order.deleteMany({ tailor: userId });
  
  // Delete tailor account
  await User.findByIdAndDelete(userId);
  
  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Account deleted successfully'
  });
};

// Update tailor profile (original function kept for backward compatibility)
const updateProfileOld = async (req, res) => {
  const { userId } = req.user;
  const { name, shopName, shopLocation, averagePrice } = req.body;
  
  const updateData = { name };
  
  // Only update tailorProfile fields if provided
  if (shopName || shopLocation || averagePrice) {
    updateData.tailorProfile = {};
    if (shopName) updateData.tailorProfile.shopName = shopName;
    if (shopLocation) updateData.tailorProfile.shopLocation = shopLocation;
    if (averagePrice) updateData.tailorProfile.averagePrice = averagePrice;
  }
  
  const tailor = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');
  
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${userId}`);
  }
  
  res.status(StatusCodes.OK).json({ tailor });
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

// Get active orders (accepted, confirmed, making, payment_done)
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
    
    // Add city filter if provided
    if (city) {
      filter.city = city;
    }
    
    // Add region filter if provided (only relevant for Islamabad)
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

module.exports = {
  getProfile,
  updateProfile,
  sendPasswordChangeOtp,
  updatePassword,
  sendDeleteAccountOtp,
  deleteAccount,
  updateProfile: updateProfileOld, // Keep old function name for existing routes
  getMyOrders,
  getOrderDetails,
  getPendingOrders,
  getActiveOrders,
  getCompletedOrders,
  getAllTailors // ADD THIS LINE
};