// server/controllers/adminController.js - Enhanced with better metrics
const User = require('../models/User');
const Order = require('../models/Order');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError } = require('../errors');

// Enhanced dashboard stats with more metrics
const getDashboardStats = async (req, res) => {
  try {
    // Basic counts
    const [customerCount, tailorCount, orderCount] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'tailor' }),
      Order.countDocuments()
    ]);

    // Order status breakdown
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Format order status stats
    const orderStatusFormatted = {
      pending: 0,
      accepted: 0,
      confirmed: 0,
      making: 0,
      payment_done: 0,
      completed: 0,
      rejected: 0
    };

    orderStatusStats.forEach(stat => {
      if (orderStatusFormatted.hasOwnProperty(stat._id)) {
        orderStatusFormatted[stat._id] = stat.count;
      }
    });

    // Recent orders (last 5)
    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(5)
      .populate('customer', 'name email')
      .populate('tailor', 'name email')
      .lean();

    // Weekly stats (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [weeklyOrders, weeklyUsers] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: weekAgo } }),
      User.countDocuments({ createdAt: { $gte: weekAgo } })
    ]);

    // Revenue calculation (completed orders with price)
    const revenueStats = await Order.aggregate([
      { $match: { status: 'completed', price: { $exists: true, $gt: 0 } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$price' },
          avgOrderValue: { $avg: '$price' },
          totalCompletedOrders: { $sum: 1 }
        }
      }
    ]);

    const revenue = revenueStats[0] || { 
      totalRevenue: 0, 
      avgOrderValue: 0, 
      totalCompletedOrders: 0 
    };

    res.status(StatusCodes.OK).json({
      success: true,
      stats: {
        // Basic counts
        customerCount,
        tailorCount,
        orderCount,
        
        // Order breakdown
        orderStatusStats: orderStatusFormatted,
        
        // Growth metrics
        weeklyOrders,
        weeklyUsers,
        
        // Revenue metrics
        totalRevenue: revenue.totalRevenue,
        avgOrderValue: Math.round(revenue.avgOrderValue || 0),
        completedOrders: revenue.totalCompletedOrders
      },
      recentOrders,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in getDashboardStats:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      error: error.message 
    });
  }
};

// Get metrics API for enhanced dashboard
const getMetrics = async (req, res) => {
  try {
    // Time-based metrics
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Orders by day (last 7 days)
    const dailyOrders = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: weekAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // User registration trend (last 30 days)
    const userGrowth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: monthAgo }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            role: "$role"
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.date": 1 } }
    ]);

    // Today's stats
    const todayStats = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: todayStart } }),
      User.countDocuments({ createdAt: { $gte: todayStart } }),
      Order.countDocuments({ 
        createdAt: { $gte: todayStart },
        status: 'completed'
      })
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      metrics: {
        dailyOrders,
        userGrowth,
        today: {
          newOrders: todayStats[0],
          newUsers: todayStats[1],
          completedOrders: todayStats[2]
        }
      }
    });
  } catch (error) {
    console.error('Error in getMetrics:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }
};

// User management - Enhanced CRUD operations
const getAllUsers = async (req, res) => {
  try {
    const { 
      role, 
      status, 
      search, 
      page = 1, 
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};
    if (role && role !== 'all') filter.role = role;
    if (status && status !== 'all') filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken -otp -otpExpires')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean(),
      User.countDocuments(filter)
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        users,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }
};

// Update user status (activate/deactivate)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Invalid status. Must be: active, inactive, or suspended'
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      throw new NotFoundError(`User with id ${id} not found`);
    }

    // If deactivating, clear refresh tokens
    if (status !== 'active') {
      user.refreshToken = undefined;
      user.refreshTokenExpires = undefined;
      await user.save();
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { user },
      msg: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully`
    });
  } catch (error) {
    console.error('Error in updateUserStatus:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error.message
    });
  }
};

// Keep existing methods
const getAllCustomers = async (req, res) => {
  const customers = await User.find({ role: 'customer' })
    .select('-password')
    .sort('createdAt');
  
  res.status(StatusCodes.OK).json({ 
    success: true,
    count: customers.length, 
    data: customers 
  });
};

const getAllTailors = async (req, res) => {
  const tailors = await User.find({ role: 'tailor' })
    .select('-password')
    .sort('createdAt');
  
  res.status(StatusCodes.OK).json({ 
    success: true,
    count: tailors.length, 
    data: tailors 
  });
};

const getAllOrders = async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  
  const filter = {};
  if (status && status !== 'all') filter.status = status;
  
  const orders = await Order.find(filter)
    .populate('customer', 'name email')
    .populate('tailor', 'name email')
    .sort('-createdAt')
    .limit(limit * 1)
    .skip((page - 1) * limit);
    
  const total = await Order.countDocuments(filter);
  
  res.status(StatusCodes.OK).json({ 
    success: true,
    data: {
      orders,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    }
  });
};

const getCustomer = async (req, res) => {
  const { id: customerId } = req.params;
  
  const customer = await User.findOne({ 
    _id: customerId, 
    role: 'customer' 
  }).select('-password');
  
  if (!customer) {
    throw new NotFoundError(`No customer with id ${customerId}`);
  }
  
  res.status(StatusCodes.OK).json({ success: true, data: customer });
};

const getTailor = async (req, res) => {
  const { id: tailorId } = req.params;
  
  const tailor = await User.findOne({ 
    _id: tailorId, 
    role: 'tailor' 
  }).select('-password');
  
  if (!tailor) {
    throw new NotFoundError(`No tailor with id ${tailorId}`);
  }
  
  res.status(StatusCodes.OK).json({ success: true, data: tailor });
};

const getOrder = async (req, res) => {
  const { id: orderId } = req.params;
  
  const order = await Order.findById(orderId)
    .populate('customer', 'name customerProfile')
    .populate('tailor', 'name tailorProfile');
  
  if (!order) {
    throw new NotFoundError(`No order with id ${orderId}`);
  }
  
  res.status(StatusCodes.OK).json({ success: true, data: order });
};

module.exports = {
  getDashboardStats,
  getMetrics,        // NEW
  getAllUsers,       // NEW - Enhanced user management
  updateUserStatus,  // NEW
  getAllCustomers,
  getAllTailors,
  getAllOrders,
  getCustomer,
  getTailor,
  getOrder
};