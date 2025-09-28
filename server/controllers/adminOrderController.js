// server/controllers/adminOrderController.js - Order management for admins
const Order = require('../models/Order');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../errors');

// Get all orders with filtering and pagination
const getAllOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      garmentType,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter object
    let filter = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (garmentType && garmentType !== 'all') {
      filter.garmentType = garmentType;
    }

    if (search && search.trim()) {
      // Search in customer name, email, or order ID
      const customerIds = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }).distinct('_id');

      filter.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { customer: { $in: customerIds } }
      ];
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Execute queries
    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name email phone')
        .populate('tailor', 'name email phone')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(filter)
    ]);

    // Calculate pagination
    const totalPages = Math.ceil(totalOrders / limitNum);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        orders,
        pagination: {
          current: pageNum,
          pages: totalPages,
          total: totalOrders,
          limit: limitNum,
          hasNext: pageNum < totalPages,
          hasPrev: pageNum > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching orders'
    });
  }
};

// Get single order by ID
const getOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('customer', 'name email phone customerProfile')
      .populate('tailor', 'name email phone tailorProfile')
      .lean();

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Order not found'
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching order'
    });
  }
};

// Update order status (Admin override)
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!status) {
      throw new BadRequestError('Status is required');
    }

    const validStatuses = ['pending', 'accepted', 'rejected', 'confirmed', 'making', 'payment_done', 'completed'];
    if (!validStatuses.includes(status)) {
      throw new BadRequestError('Invalid status');
    }

    const order = await Order.findById(id);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Admin can override any status transition
    const updateData = { status };
    
    if (notes) {
      updateData.notes = notes;
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('customer tailor');

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    if (error.name === 'CastError') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Invalid order ID'
      });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: error.message || 'Server error while updating order status'
    });
  }
};

// Reassign tailor to an order
const reassignTailor = async (req, res) => {
  try {
    const { id } = req.params;
    const { tailorId } = req.body;

    if (!tailorId) {
      throw new BadRequestError('Tailor ID is required');
    }

    const order = await Order.findById(id);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Verify the new tailor exists and is active
    const tailor = await User.findOne({ 
      _id: tailorId, 
      role: 'tailor',
      status: 'active'
    });

    if (!tailor) {
      throw new NotFoundError('Active tailor not found');
    }

    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { tailor: tailorId },
      { new: true, runValidators: true }
    ).populate('customer tailor');

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Tailor reassigned successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Reassign tailor error:', error);
    if (error.name === 'CastError') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Invalid order or tailor ID'
      });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: error.message || 'Server error while reassigning tailor'
    });
  }
};

// Delete order (Admin only)
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      throw new NotFoundError('Order not found');
    }

    // Only allow deletion if order is in early stages
    const deletableStatuses = ['pending', 'rejected'];
    if (!deletableStatuses.includes(order.status)) {
      throw new BadRequestError('Cannot delete order in current status');
    }

    await Order.findByIdAndDelete(id);

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    if (error.name === 'CastError') {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Invalid order ID'
      });
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: error.message || 'Server error while deleting order'
    });
  }
};

// Get order statistics for dashboard
const getOrderStats = async (req, res) => {
  try {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      totalOrders,
      ordersByStatus,
      weeklyOrders,
      completedOrders,
      revenueStats
    ] = await Promise.all([
      Order.countDocuments(),
      
      Order.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),
      
      Order.countDocuments({
        createdAt: { $gte: oneWeekAgo }
      }),
      
      Order.countDocuments({ status: 'completed' }),
      
      Order.aggregate([
        {
          $match: { 
            status: 'completed',
            price: { $exists: true, $ne: null }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$price' },
            avgOrderValue: { $avg: '$price' },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // Format order status stats
    const orderStatusStats = {};
    const statusList = ['pending', 'accepted', 'rejected', 'confirmed', 'making', 'payment_done', 'completed'];
    
    statusList.forEach(status => {
      orderStatusStats[status] = 0;
    });
    
    ordersByStatus.forEach(item => {
      orderStatusStats[item._id] = item.count;
    });

    // Format revenue stats
    const revenue = revenueStats[0] || { totalRevenue: 0, avgOrderValue: 0, count: 0 };

    res.status(StatusCodes.OK).json({
      success: true,
      stats: {
        orderCount: totalOrders,
        orderStatusStats,
        weeklyOrders,
        completedOrders,
        totalRevenue: Math.round(revenue.totalRevenue || 0),
        avgOrderValue: Math.round(revenue.avgOrderValue || 0)
      }
    });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching order statistics'
    });
  }
};

// Get recent orders activity
const getRecentOrders = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const recentOrders = await Order.find()
      .populate('customer', 'name email')
      .populate('tailor', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .lean();

    res.status(StatusCodes.OK).json({
      success: true,
      orders: recentOrders
    });
  } catch (error) {
    console.error('Get recent orders error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching recent orders'
    });
  }
};

module.exports = {
  getAllOrders,
  getOrder,
  updateOrderStatus,
  reassignTailor,
  deleteOrder,
  getOrderStats,
  getRecentOrders
};