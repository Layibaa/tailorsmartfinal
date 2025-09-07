// server/controllers/adminController.js - Fixed to return correct data structure
const User = require('../models/User');
const Order = require('../models/Order');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError } = require('../errors');

// Enhanced dashboard stats with proper error handling
const getDashboardStats = async (req, res) => {
  try {
    console.log('AdminController: Getting dashboard stats...');
    
    // Basic counts with error handling
    const [customerCount, tailorCount, orderCount] = await Promise.all([
      User.countDocuments({ role: 'customer' }).catch(() => 0),
      User.countDocuments({ role: 'tailor' }).catch(() => 0),
      Order.countDocuments().catch(() => 0)
    ]);

    console.log('AdminController: Basic counts -', { customerCount, tailorCount, orderCount });

    // Order status breakdown
    let orderStatusStats = {
      pending: 0,
      accepted: 0,
      confirmed: 0,
      making: 0,
      payment_done: 0,
      completed: 0,
      rejected: 0
    };

    try {
      const orderStatusAgg = await Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);

      // Update counts from aggregation
      orderStatusAgg.forEach(stat => {
        if (orderStatusStats.hasOwnProperty(stat._id)) {
          orderStatusStats[stat._id] = stat.count;
        }
      });

      console.log('AdminController: Order status stats -', orderStatusStats);
    } catch (error) {
      console.warn('AdminController: Failed to get order status stats:', error.message);
    }

    // Weekly stats (last 7 days)
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    let weeklyOrders = 0;
    let weeklyUsers = 0;

    try {
      [weeklyOrders, weeklyUsers] = await Promise.all([
        Order.countDocuments({ createdAt: { $gte: weekAgo } }).catch(() => 0),
        User.countDocuments({ createdAt: { $gte: weekAgo } }).catch(() => 0)
      ]);
      console.log('AdminController: Weekly stats -', { weeklyOrders, weeklyUsers });
    } catch (error) {
      console.warn('AdminController: Failed to get weekly stats:', error.message);
    }

    // Revenue calculation (completed orders with price)
    let totalRevenue = 0;
    let avgOrderValue = 0;
    let completedOrders = 0;

    try {
      const revenueStats = await Order.aggregate([
        { 
          $match: { 
            status: 'completed', 
            price: { $exists: true, $gt: 0 } 
          } 
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$price' },
            avgOrderValue: { $avg: '$price' },
            totalCompletedOrders: { $sum: 1 }
          }
        }
      ]);

      if (revenueStats.length > 0) {
        totalRevenue = revenueStats[0].totalRevenue || 0;
        avgOrderValue = Math.round(revenueStats[0].avgOrderValue || 0);
        completedOrders = revenueStats[0].totalCompletedOrders || 0;
      }

      console.log('AdminController: Revenue stats -', { totalRevenue, avgOrderValue, completedOrders });
    } catch (error) {
      console.warn('AdminController: Failed to get revenue stats:', error.message);
    }

    // Get recent orders for activity feed
    let recentOrders = [];
    try {
      recentOrders = await Order.find()
        .sort('-createdAt')
        .limit(5)
        .populate('customer', 'name email')
        .populate('tailor', 'name email')
        .lean();
    } catch (error) {
      console.warn('AdminController: Failed to get recent orders:', error.message);
    }

    const stats = {
      // Basic counts
      customerCount,
      tailorCount,
      orderCount,
      
      // Order breakdown
      orderStatusStats,
      
      // Growth metrics
      weeklyOrders,
      weeklyUsers,
      
      // Revenue metrics
      totalRevenue,
      avgOrderValue,
      completedOrders
    };

    console.log('AdminController: Returning dashboard stats:', stats);

    res.status(StatusCodes.OK).json({
      success: true,
      stats,
      recentOrders,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('AdminController: Dashboard stats error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      msg: 'Failed to fetch dashboard statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
    ]).catch(() => []);

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
    ]).catch(() => []);

    // Today's stats
    const [todayOrders, todayUsers, todayCompletedOrders] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: todayStart } }).catch(() => 0),
      User.countDocuments({ createdAt: { $gte: todayStart } }).catch(() => 0),
      Order.countDocuments({ 
        createdAt: { $gte: todayStart },
        status: 'completed'
      }).catch(() => 0)
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      metrics: {
        dailyOrders,
        userGrowth,
        today: {
          newOrders: todayOrders,
          newUsers: todayUsers,
          completedOrders: todayCompletedOrders
        }
      }
    });
  } catch (error) {
    console.error('AdminController: Metrics error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to fetch metrics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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

    console.log('AdminController: Getting users with params:', req.query);

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

    // Parse pagination
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    console.log('AdminController: Filter:', filter, 'Sort:', sort, 'Pagination:', { page: pageNum, limit: limitNum, skip });

    // Execute query with pagination
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken -otp -otpExpires -passwordResetToken -passwordResetExpires')
        .sort(sort)
        .limit(limitNum)
        .skip(skip)
        .lean(),
      User.countDocuments(filter)
    ]);

    console.log('AdminController: Found', users.length, 'users out of', total, 'total');

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        users,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error('AdminController: Get users error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update user status (activate/deactivate/suspend)
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log('AdminController: Updating user status:', id, 'to', status);

    if (!['active', 'inactive', 'suspended'].includes(status)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Invalid status. Must be: active, inactive, or suspended'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: `User with id ${id} not found`
      });
    }

    // Prevent modification of superadmin users
    if (user.role === 'superadmin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        msg: 'Cannot modify superadmin users'
      });
    }

    user.status = status;
    
    // If deactivating, clear refresh tokens
    if (status !== 'active') {
      user.refreshToken = undefined;
      user.refreshTokenExpires = undefined;
    }

    await user.save();

    const updatedUser = await User.findById(id)
      .select('-password -refreshToken -otp -otpExpires -passwordResetToken -passwordResetExpires')
      .lean();

    console.log('AdminController: User status updated successfully');

    res.status(StatusCodes.OK).json({
      success: true,
      data: { user: updatedUser },
      msg: `User ${status === 'active' ? 'activated' : status === 'inactive' ? 'deactivated' : 'suspended'} successfully`
    });
  } catch (error) {
    console.error('AdminController: Update user status error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to update user status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Keep existing methods for backward compatibility
const getAllCustomers = async (req, res) => {
  try {
    const customers = await User.find({ role: 'customer' })
      .select('-password -refreshToken')
      .sort('createdAt');
    
    res.status(StatusCodes.OK).json({ 
      success: true,
      count: customers.length, 
      data: customers 
    });
  } catch (error) {
    console.error('AdminController: Get customers error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to fetch customers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getAllTailors = async (req, res) => {
  try {
    const tailors = await User.find({ role: 'tailor' })
      .select('-password -refreshToken')
      .sort('createdAt');
    
    res.status(StatusCodes.OK).json({ 
      success: true,
      count: tailors.length, 
      data: tailors 
    });
  } catch (error) {
    console.error('AdminController: Get tailors error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to fetch tailors',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status && status !== 'all') filter.status = status;
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    
    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name email')
        .populate('tailor', 'name email')
        .sort('-createdAt')
        .limit(limitNum)
        .skip((pageNum - 1) * limitNum),
      Order.countDocuments(filter)
    ]);
    
    res.status(StatusCodes.OK).json({ 
      success: true,
      data: {
        orders,
        pagination: {
          current: pageNum,
          pages: Math.ceil(total / limitNum),
          total
        }
      }
    });
  } catch (error) {
    console.error('AdminController: Get orders error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getCustomer = async (req, res) => {
  try {
    const { id: customerId } = req.params;
    
    const customer = await User.findOne({ 
      _id: customerId, 
      role: 'customer' 
    }).select('-password -refreshToken');
    
    if (!customer) {
      throw new NotFoundError(`No customer with id ${customerId}`);
    }
    
    res.status(StatusCodes.OK).json({ success: true, data: customer });
  } catch (error) {
    console.error('AdminController: Get customer error:', error);
    if (error.name === 'NotFoundError') {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, msg: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        msg: 'Failed to fetch customer',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

const getTailor = async (req, res) => {
  try {
    const { id: tailorId } = req.params;
    
    const tailor = await User.findOne({ 
      _id: tailorId, 
      role: 'tailor' 
    }).select('-password -refreshToken');
    
    if (!tailor) {
      throw new NotFoundError(`No tailor with id ${tailorId}`);
    }
    
    res.status(StatusCodes.OK).json({ success: true, data: tailor });
  } catch (error) {
    console.error('AdminController: Get tailor error:', error);
    if (error.name === 'NotFoundError') {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, msg: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        msg: 'Failed to fetch tailor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

const getOrder = async (req, res) => {
  try {
    const { id: orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate('customer', 'name customerProfile')
      .populate('tailor', 'name tailorProfile');
    
    if (!order) {
      throw new NotFoundError(`No order with id ${orderId}`);
    }
    
    res.status(StatusCodes.OK).json({ success: true, data: order });
  } catch (error) {
    console.error('AdminController: Get order error:', error);
    if (error.name === 'NotFoundError') {
      res.status(StatusCodes.NOT_FOUND).json({ success: false, msg: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        msg: 'Failed to fetch order',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
};

module.exports = {
  getDashboardStats,
  getMetrics,
  getAllUsers,
  updateUserStatus,
  getAllCustomers,
  getAllTailors,
  getAllOrders,
  getCustomer,
  getTailor,
  getOrder
};