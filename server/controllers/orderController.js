const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');
const TailorProfile = require('../models/TailorProfile');
const mongoose = require('mongoose');

// @desc    Create a new order
// @route   POST /api/orders
// @access  Private (Customer only)
exports.createOrder = async (req, res, next) => {
  try {
    const { tailorId, garmentType, description, measurements, fabricImage } = req.body;

    // Validate input
    if (!tailorId || !garmentType || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide tailor, garment type, and description',
      });
    }

    // Check if the tailor exists
    const tailorProfile = await TailorProfile.findById(tailorId);
    if (!tailorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Tailor not found',
      });
    }

    // Get tailor user ID
    const tailorUser = await User.findById(tailorProfile.user);
    if (!tailorUser || tailorUser.role !== 'tailor') {
      return res.status(400).json({
        success: false,
        message: 'Invalid tailor selected',
      });
    }

    // Generate unique order number
    const orderCount = await Order.countDocuments();
    const orderNumber = `ORD${String(orderCount + 1).padStart(5, '0')}`;

    // Create the order
    const order = await Order.create({
      orderNumber,
      customer: req.user.id,
      tailor: tailorUser._id,
      garmentType,
      description,
      status: 'Pending',
      measurements,
      fabricImage,
    });

    // Create notification for tailor
    await Notification.create({
      recipient: tailorUser._id,
      title: 'New Order Received',
      message: `You have received a new ${garmentType} order from ${req.user.name}`,
      type: 'order',
      referenceId: order._id,
    });

    res.status(201).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all orders (filtered by user role)
// @route   GET /api/orders
// @access  Private
exports.getOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    // Add status filter if provided
    if (status) {
      filter.status = status;
    }

    // Add user filter based on role
    if (req.user.role === 'customer') {
      filter.customer = req.user.id;
    } else if (req.user.role === 'tailor') {
      filter.tailor = req.user.id;
    }

    // For admin, no additional filter needed - they see all orders

    const orders = await Order.find(filter)
      .populate({
        path: 'customer',
        select: 'name email phone',
      })
      .populate({
        path: 'tailor',
        select: 'name email phone',
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get recent orders
// @route   GET /api/orders/recent
// @access  Private
exports.getRecentOrders = async (req, res, next) => {
  try {
    const filter = {};

    // Add user filter based on role
    if (req.user.role === 'customer') {
      filter.customer = req.user.id;
    } else if (req.user.role === 'tailor') {
      filter.tailor = req.user.id;
    }

    const orders = await Order.find(filter)
      .populate({
        path: 'customer',
        select: 'name email phone',
      })
      .populate({
        path: 'tailor',
        select: 'name email phone',
      })
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate({
        path: 'customer',
        select: 'name email phone gender age height weight',
      })
      .populate({
        path: 'tailor',
        select: 'name email phone',
      })
      .populate({
        path: 'tailor',
        select: '_id name',
        populate: {
          path: 'tailorProfile',
          model: 'TailorProfile',
          select: 'shopName location rating priceRange',
        },
      });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user is authorized to view this order
    if (
      req.user.role !== 'admin' &&
      order.customer._id.toString() !== req.user.id &&
      order.tailor._id.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this order',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Tailor or Admin only)
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // Validate status
    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided',
      });
    }

    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user is authorized to update this order
    if (
      req.user.role !== 'admin' &&
      order.tailor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order',
      });
    }

    // Update order status
    order.status = status;
    await order.save();

    // Create notification for customer
    await Notification.create({
      recipient: order.customer,
      title: 'Order Status Updated',
      message: `Your order #${order.orderNumber} status has been updated to ${status}`,
      type: 'order',
      referenceId: order._id,
    });

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order details
// @route   PUT /api/orders/:id
// @access  Private
exports.updateOrder = async (req, res, next) => {
  try {
    const { description, measurements } = req.body;
    
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user is authorized to update this order
    if (
      req.user.role !== 'admin' &&
      order.customer.toString() !== req.user.id &&
      order.tailor.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this order',
      });
    }

    // Check if order can be updated (not completed or cancelled)
    if (order.status === 'Completed' || order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: `Cannot update order with status: ${order.status}`,
      });
    }

    // Update order details
    if (description) order.description = description;
    if (measurements) order.measurements = measurements;

    await order.save();

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order (cancel)
// @route   DELETE /api/orders/:id
// @access  Private (Customer only)
exports.deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Check if user is authorized to delete this order
    if (
      req.user.role !== 'admin' &&
      order.customer.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this order',
      });
    }

    // Can only delete/cancel pending orders
    if (order.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Can only cancel pending orders',
      });
    }

    // Mark as cancelled instead of deleting
    order.status = 'Cancelled';
    await order.save();

    // Create notification for tailor
    await Notification.create({
      recipient: order.tailor,
      title: 'Order Cancelled',
      message: `Order #${order.orderNumber} has been cancelled by the customer`,
      type: 'order',
      referenceId: order._id,
    });

    res.status(200).json({
      success: true,
      data: {},
      message: 'Order cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};