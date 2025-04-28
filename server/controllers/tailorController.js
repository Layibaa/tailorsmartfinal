const User = require('../models/User');
const Order = require('../models/Order');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');

// Update tailor profile
const updateProfile = async (req, res) => {
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

module.exports = {
  updateProfile,
  getMyOrders,
  getOrderDetails,
  getPendingOrders,
  getActiveOrders,
  getCompletedOrders
};
