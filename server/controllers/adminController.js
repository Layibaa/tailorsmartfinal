const User = require('../models/User');
const Order = require('../models/Order');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError } = require('../errors');

// Get dashboard stats
const getDashboardStats = async (req, res) => {
  // Get counts
  const customerCount = await User.countDocuments({ role: 'customer' });
  const tailorCount = await User.countDocuments({ role: 'tailor' });
  const orderCount = await Order.countDocuments();
  
  // Get recent orders
  const recentOrders = await Order.find()
    .sort('-createdAt')
    .limit(5)
    .populate('customer', 'name')
    .populate('tailor', 'name');
  
  // Get order stats by status
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const acceptedOrders = await Order.countDocuments({ status: 'accepted' });
  const confirmedOrders = await Order.countDocuments({ status: 'confirmed' });
  const makingOrders = await Order.countDocuments({ status: 'making' });
  const paymentDoneOrders = await Order.countDocuments({ status: 'payment_done' });
  const completedOrders = await Order.countDocuments({ status: 'completed' });
  const rejectedOrders = await Order.countDocuments({ status: 'rejected' });
  
  res.status(StatusCodes.OK).json({
    stats: {
      customerCount,
      tailorCount,
      orderCount,
      orderStatusStats: {
        pending: pendingOrders,
        accepted: acceptedOrders,
        confirmed: confirmedOrders,
        making: makingOrders,
        payment_done: paymentDoneOrders,
        completed: completedOrders,
        rejected: rejectedOrders
      }
    },
    recentOrders
  });
};

// Get all customers
const getAllCustomers = async (req, res) => {
  const customers = await User.find({ role: 'customer' })
    .select('-password')
    .sort('createdAt');
  
  res.status(StatusCodes.OK).json({ count: customers.length, customers });
};

// Get all tailors
const getAllTailors = async (req, res) => {
  const tailors = await User.find({ role: 'tailor' })
    .select('-password')
    .sort('createdAt');
  
  res.status(StatusCodes.OK).json({ count: tailors.length, tailors });
};

// Get all orders
const getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate('customer', 'name')
    .populate('tailor', 'name')
    .sort('-createdAt');
  
  res.status(StatusCodes.OK).json({ count: orders.length, orders });
};

// Get specific customer
const getCustomer = async (req, res) => {
  const { id: customerId } = req.params;
  
  const customer = await User.findOne({ 
    _id: customerId, 
    role: 'customer' 
  }).select('-password');
  
  if (!customer) {
    throw new NotFoundError(`No customer with id ${customerId}`);
  }
  
  res.status(StatusCodes.OK).json({ customer });
};

// Get specific tailor
const getTailor = async (req, res) => {
  const { id: tailorId } = req.params;
  
  const tailor = await User.findOne({ 
    _id: tailorId, 
    role: 'tailor' 
  }).select('-password');
  
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${tailorId}`);
  }
  
  res.status(StatusCodes.OK).json({ tailor });
};

// Get specific order
const getOrder = async (req, res) => {
  const { id: orderId } = req.params;
  
  const order = await Order.findById(orderId)
    .populate('customer', 'name customerProfile')
    .populate('tailor', 'name tailorProfile');
  
  if (!order) {
    throw new NotFoundError(`No order with id ${orderId}`);
  }
  
  res.status(StatusCodes.OK).json({ order });
};

module.exports = {
  getDashboardStats,
  getAllCustomers,
  getAllTailors,
  getAllOrders,
  getCustomer,
  getTailor,
  getOrder
};
