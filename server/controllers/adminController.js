// ====================
// Enhanced server/controllers/adminController.js
// ====================
const User = require('../models/User');
const Order = require('../models/Order');
const Admin = require('../models/Admin');
const { StatusCodes } = require('http-status-codes');
const { NotFoundError } = require('../errors');

// Get enhanced dashboard stats with analytics
const getDashboardStats = async (req, res) => {
  console.log('Enhanced getDashboardStats called at:', new Date().toISOString());
  
  try {
    // Get basic counts
    const [customerCount, tailorCount, orderCount, adminCount] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      User.countDocuments({ role: 'tailor' }),
      Order.countDocuments(),
      Admin.countDocuments({ isActive: true })
    ]);
    
    // Get order stats by status
    const orderStatusStats = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          status: '$_id',
          count: 1,
          _id: 0
        }
      }
    ]);
    
    // Convert to object format
    const orderStatusObj = {
      pending: 0,
      accepted: 0,
      confirmed: 0,
      making: 0,
      payment_done: 0,
      completed: 0,
      rejected: 0
    };
    
    orderStatusStats.forEach(stat => {
      orderStatusObj[stat.status] = stat.count;
    });
    
    // Get recent orders with enhanced data
    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(10)
      .populate('customer', 'name email')
      .populate('tailor', 'name email')
      .lean();
    
    // Get growth analytics (last 30 days vs previous 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
    
    const [recentCustomers, previousCustomers] = await Promise.all([
      User.countDocuments({ role: 'customer', createdAt: { $gte: thirtyDaysAgo } }),
      User.countDocuments({ 
        role: 'customer', 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } 
      })
    ]);
    
    const [recentOrders30, previousOrders30] = await Promise.all([
      Order.countDocuments({ createdAt: { $gte: thirtyDaysAgo } }),
      Order.countDocuments({ 
        createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo } 
      })
    ]);
    
    // Calculate growth percentages
    const customerGrowth = previousCustomers > 0 
      ? ((recentCustomers - previousCustomers) / previousCustomers * 100).toFixed(1)
      : 0;
    
    const orderGrowth = previousOrders30 > 0 
      ? ((recentOrders30 - previousOrders30) / previousOrders30 * 100).toFixed(1)
      : 0;
    
    // Get revenue analytics (mock data - implement based on your payment system)
    const revenueData = await Order.aggregate([
      { $match: { status: 'completed', price: { $exists: true } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalRevenue: { $sum: '$price' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 }
    ]);
    
    // Get top performing tailors
    const topTailors = await Order.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$tailor',
          completedOrders: { $sum: 1 },
          totalRevenue: { $sum: '$price' }
        }
      },
      { $sort: { completedOrders: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'tailorInfo'
        }
      },
      { $unwind: '$tailorInfo' },
      {
        $project: {
          name: '$tailorInfo.name',
          email: '$tailorInfo.email',
          completedOrders: 1,
          totalRevenue: 1
        }
      }
    ]);
    
    const response = {
      success: true,
      stats: {
        customerCount,
        tailorCount,
        orderCount,
        adminCount,
        orderStatusStats: orderStatusObj,
        analytics: {
          customerGrowth: parseFloat(customerGrowth),
          orderGrowth: parseFloat(orderGrowth),
          recentCustomers,
          recentOrders: recentOrders30
        }
      },
      recentOrders,
      revenueData,
      topTailors,
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending enhanced dashboard response');
    res.status(StatusCodes.OK).json(response);
    
  } catch (error) {
    console.error('Error in enhanced getDashboardStats:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
      success: false,
      message: 'Failed to fetch dashboard statistics',
      error: error.message 
    });
  }
};

// Get system analytics
const getSystemAnalytics = async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    
    // Calculate date range based on period
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get daily order counts for the period
    const dailyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          orders: { $sum: 1 },
          revenue: { $sum: { $ifNull: ['$price', 0] } }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    // Get user registration trends
    const userRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' },
            role: '$role'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);
    
    res.status(StatusCodes.OK).json({
      success: true,
      analytics: {
        period,
        dailyOrders,
        userRegistrations
      }
    });
    
  } catch (error) {
    console.error('Error getting system analytics:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
};

// Get all customers with enhanced filtering
const getAllCustomers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      verified 
    } = req.query;
    
    // Build filter object
    const filter = { role: 'customer' };
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (verified !== undefined) {
      filter.isVerified = verified === 'true';
    }
    
    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    
    const customers = await User.find(filter)
      .select('-password -otp -otpExpires')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    
    const total = await User.countDocuments(filter);
    
    res.status(StatusCodes.OK).json({
      success: true,
      customers,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Error getting customers:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch customers'
    });
  }
};

// Keep existing methods and add new ones...
const getAllTailors = async (req, res) => {
  const tailors = await User.find({ role: 'tailor' })
    .select('-password')
    .sort('createdAt');
  
  res.status(StatusCodes.OK).json({ count: tailors.length, tailors });
};

const getAllOrders = async (req, res) => {
  const orders = await Order.find()
    .populate('customer', 'name')
    .populate('tailor', 'name')
    .sort('-createdAt');
  
  res.status(StatusCodes.OK).json({ count: orders.length, orders });
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
  
  res.status(StatusCodes.OK).json({ customer });
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
  
  res.status(StatusCodes.OK).json({ tailor });
};

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
  getSystemAnalytics,
  getAllCustomers,
  getAllTailors,
  getAllOrders,
  getCustomer,
  getTailor,
  getOrder
};