const User = require('../models/User');
const Order = require('../models/Order');
const TailorProfile = require('../models/TailorProfile');

// @desc    Get admin dashboard metrics
// @route   GET /api/admin/metrics
// @access  Private (Admin only)
exports.getMetrics = async (req, res, next) => {
  try {
    // Count total customers
    const totalCustomers = await User.countDocuments({ role: 'customer' });

    // Count total tailors
    const totalTailors = await User.countDocuments({ role: 'tailor' });

    // Count total orders
    const totalOrders = await Order.countDocuments();

    // Count active orders (pending + in progress)
    const activeOrders = await Order.countDocuments({
      status: { $in: ['Pending', 'In Progress'] }
    });

    // Count orders by status
    const ordersByStatus = {
      pending: await Order.countDocuments({ status: 'Pending' }),
      inProgress: await Order.countDocuments({ status: 'In Progress' }),
      completed: await Order.countDocuments({ status: 'Completed' }),
      cancelled: await Order.countDocuments({ status: 'Cancelled' })
    };

    // Count new users this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const newCustomersThisMonth = await User.countDocuments({
      role: 'customer',
      createdAt: { $gte: startOfMonth }
    });

    const newTailorsThisMonth = await User.countDocuments({
      role: 'tailor',
      createdAt: { $gte: startOfMonth }
    });

    // Return all metrics
    res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        totalTailors,
        totalOrders,
        activeOrders,
        ordersByStatus,
        newCustomersThisMonth,
        newTailorsThisMonth
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    const filter = {};

    // Filter by role if provided
    if (role) {
      filter.role = role;
    }

    const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private (Admin only)
exports.getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If the user is a tailor, include their tailor profile
    let tailorProfile = null;
    if (user.role === 'tailor') {
      tailorProfile = await TailorProfile.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      data: {
        user,
        tailorProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res, next) => {
  try {
    const { name, email, role, isActive } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // If role was changed to tailor, create tailor profile if it doesn't exist
    if (role === 'tailor') {
      const existingProfile = await TailorProfile.findOne({ user: user._id });
      if (!existingProfile) {
        await TailorProfile.create({
          user: user._id,
          shopName: `${user.name}'s Tailoring`,
          location: 'Not specified',
          priceRange: 'Not specified',
          rating: 0
        });
      }
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // If the user is a tailor, delete their tailor profile
    if (user.role === 'tailor') {
      await TailorProfile.findOneAndDelete({ user: user._id });
    }

    // Delete the user
    await user.remove();

    res.status(200).json({
      success: true,
      data: {},
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
