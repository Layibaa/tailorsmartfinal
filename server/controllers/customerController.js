// controllers/customerController.js - CREATE THIS FILE
const Order = require('../models/Order');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');

// Get customer's orders
const getMyOrders = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    console.log('Getting orders for customer:', userId);
    console.log('User role:', req.user.role);
    
    const orders = await Order.find({ customer: userId })
      .populate('tailor', 'name email phone')
      .populate('customer', 'name email phone')
      .sort({ createdAt: -1 });

    console.log(`Found ${orders.length} orders`);

    res.json({
      success: true,
      orders: orders
    });

  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching orders'
    });
  }
};

// Get specific order details
const getOrderDetails = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { id } = req.params;
    
    const order = await Order.findOne({ 
      _id: id, 
      customer: userId 
    })
      .populate('tailor', 'name email phone')
      .populate('customer', 'name email phone');

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Order not found'
      });
    }

    res.json({
      success: true,
      order: order
    });

  } catch (error) {
    console.error('Get order details error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching order details'
    });
  }
};

// Get all tailors
const getAllTailors = async (req, res) => {
  try {
    const tailors = await User.find({ role: 'tailor', status: 'active' })
      .select('name email phone tailorProfile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      tailors: tailors
    });

  } catch (error) {
    console.error('Get tailors error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching tailors'
    });
  }
};

// Get specific tailor
const getTailor = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tailor = await User.findOne({ 
      _id: id, 
      role: 'tailor', 
      status: 'active' 
    }).select('name email phone tailorProfile');

    if (!tailor) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Tailor not found'
      });
    }

    res.json({
      success: true,
      tailor: tailor
    });

  } catch (error) {
    console.error('Get tailor error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching tailor'
    });
  }
};

// Update customer profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const updates = req.body;

    // Remove sensitive fields
    delete updates.password;
    delete updates.role;
    delete updates._id;

    const customer = await User.findByIdAndUpdate(
      userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Customer not found'
      });
    }

    res.json({
      success: true,
      customer: customer
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while updating profile'
    });
  }
};

module.exports = {
  getMyOrders,
  getOrderDetails,
  getAllTailors,
  getTailor,
  updateProfile
};