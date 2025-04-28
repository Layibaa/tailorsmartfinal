const User = require('../models/User');
const Order = require('../models/Order');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');

// Get all tailors
const getAllTailors = async (req, res) => {
  const tailors = await User.find({ role: 'tailor', isVerified: true })
    .select('name tailorProfile createdAt')
    .sort('createdAt');
  
  res.status(StatusCodes.OK).json({ count: tailors.length, tailors });
};

// Get single tailor by ID
const getTailor = async (req, res) => {
  const { id: tailorId } = req.params;
  
  const tailor = await User.findOne({ 
    _id: tailorId, 
    role: 'tailor',
    isVerified: true 
  }).select('name tailorProfile createdAt');
  
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${tailorId}`);
  }
  
  res.status(StatusCodes.OK).json({ tailor });
};

// Update customer profile
const updateProfile = async (req, res) => {
  const { userId } = req.user;
  const { name, age, gender, weight, height } = req.body;
  
  const updateData = { name };
  
  // Only update customerProfile fields if provided
  if (age || gender || weight || height) {
    updateData.customerProfile = {};
    if (age) updateData.customerProfile.age = age;
    if (gender) updateData.customerProfile.gender = gender;
    if (weight) updateData.customerProfile.weight = weight;
    if (height) updateData.customerProfile.height = height;
  }
  
  const customer = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');
  
  if (!customer) {
    throw new NotFoundError(`No customer with id ${userId}`);
  }
  
  res.status(StatusCodes.OK).json({ customer });
};

// Get customer's orders
const getMyOrders = async (req, res) => {
  const { userId } = req.user;
  
  const orders = await Order.find({ customer: userId })
    .populate('tailor', 'name tailorProfile')
    .sort('-createdAt');
  
  res.status(StatusCodes.OK).json({ count: orders.length, orders });
};

// Get single order details
const getOrderDetails = async (req, res) => {
  const { userId } = req.user;
  const { id: orderId } = req.params;
  
  const order = await Order.findOne({
    _id: orderId,
    customer: userId
  }).populate('tailor', 'name tailorProfile');
  
  if (!order) {
    throw new NotFoundError(`No order with id ${orderId}`);
  }
  
  res.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getAllTailors,
  getTailor,
  updateProfile,
  getMyOrders,
  getOrderDetails
};
