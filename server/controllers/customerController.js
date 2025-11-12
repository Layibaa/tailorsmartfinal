// server/controllers/customerController.js - FIXED (removed address, using email)
const Order = require('../models/Order');
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

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
      .select('name email phone tailorProfile city region')
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
    }).select('name email phone tailorProfile city region');

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

// Get customer profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const customer = await User.findById(userId)
      .select('-password -refreshToken -otp -otpExpires -passwordResetToken -passwordResetExpires');

    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Customer not found'
      });
    }

    console.log('✅ Customer profile fetched:', {
      name: customer.name,
      email: customer.email,
      city: customer.city,
      region: customer.region,
      customerProfile: customer.customerProfile
    });

    res.json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error('Get customer profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while fetching profile'
    });
  }
};

// ✅ FIXED: Update customer profile - removed address, proper handling
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { 
      name, 
      email,  // ✅ ADDED: email field
      city, 
      region, 
      age, 
      gender, 
      weight, 
      height, 
      preferredStyles 
      // ✅ REMOVED: address field
    } = req.body;

    console.log('📝 Updating customer profile:', {
      userId,
      name,
      email,
      city,
      region,
      customerProfileFields: { age, gender, weight, height, preferredStyles }
    });

    // Get existing customer data first
    const existingCustomer = await User.findById(userId);
    if (!existingCustomer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Customer not found'
      });
    }

    // Build update data
    const updateData = {};
    
    // Basic fields
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email; // ✅ ADDED
    if (city !== undefined) {
      updateData.city = city;
      // Clear region if city is not Islamabad
      if (city !== 'Islamabad') {
        updateData.region = null;
      }
    }
    if (region !== undefined) {
      updateData.region = region || null;
    }

    // ✅ FIXED: Customer profile fields - preserve existing data, removed address
    if (age !== undefined || gender !== undefined || weight !== undefined || 
        height !== undefined || preferredStyles !== undefined) {
      
      // Start with existing profile or empty object
      updateData.customerProfile = existingCustomer.customerProfile 
        ? { ...existingCustomer.customerProfile.toObject() }
        : {};
      
      // Update only provided fields
      if (age !== undefined) {
        updateData.customerProfile.age = age ? parseInt(age) : null;
      }
      if (gender !== undefined) {
        updateData.customerProfile.gender = gender; // Now accepts 'Male', 'Female', 'Other'
      }
      if (weight !== undefined) {
        updateData.customerProfile.weight = weight ? parseFloat(weight) : null;
      }
      if (height !== undefined) {
        updateData.customerProfile.height = height ? parseFloat(height) : null;
      }
      if (preferredStyles !== undefined) {
        updateData.customerProfile.preferredStyles = preferredStyles;
      }
      // ✅ REMOVED: address handling

      console.log('✅ Customer profile to update:', updateData.customerProfile);
    }

    // Perform update
    const customer = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).select('-password -refreshToken -otp -otpExpires -passwordResetToken -passwordResetExpires');

    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'Customer not found'
      });
    }

    console.log('✅ Customer profile updated successfully:', {
      name: customer.name,
      email: customer.email,
      city: customer.city,
      region: customer.region,
      customerProfile: customer.customerProfile
    });

    res.json({
      success: true,
      msg: 'Profile updated successfully',
      data: customer
    });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: validationErrors.join(', ')
      });
    }
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while updating profile'
    });
  }
};

// Send OTP for password change
const sendPasswordChangeOtp = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    try {
      if (typeof sendEmail === 'function') {
        await sendEmail({
          to: user.email,
          subject: 'Password Change OTP - Tailor Smart',
          text: `Your OTP for password change is: ${otp}. This OTP will expire in 10 minutes.`
        });
      } else {
        console.log(`Password change OTP for ${user.email}: ${otp}`);
      }

      res.json({
        success: true,
        msg: 'OTP sent to your email for password change verification'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.json({
        success: true,
        msg: 'OTP generated for password change',
        otp: otp // Only for development
      });
    }

  } catch (error) {
    console.error('Send password change OTP error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while sending OTP'
    });
  }
};

// Update password with OTP verification
const updatePassword = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { newPassword, otp } = req.body;

    if (!newPassword || !otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'New password and OTP are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Password must be at least 6 characters'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Invalid OTP'
      });
    }

    if (user.otpExpires < new Date()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'OTP has expired'
      });
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.json({
      success: true,
      msg: 'Password updated successfully'
    });

  } catch (error) {
    console.error('Update password error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while updating password'
    });
  }
};

// Send OTP for account deletion
const sendDeleteAccountOtp = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    // Send OTP email
    try {
      if (typeof sendEmail === 'function') {
        await sendEmail({
          to: user.email,
          subject: 'Account Deletion OTP - Tailor Smart',
          text: `Your OTP for account deletion is: ${otp}. This OTP will expire in 10 minutes. If you did not request this, please ignore this email.`
        });
      } else {
        console.log(`Account deletion OTP for ${user.email}: ${otp}`);
      }

      res.json({
        success: true,
        msg: 'OTP sent to your email for account deletion verification'
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      res.json({
        success: true,
        msg: 'OTP generated for account deletion',
        otp: otp // Only for development
      });
    }

  } catch (error) {
    console.error('Send delete account OTP error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while sending OTP'
    });
  }
};

// Delete account with OTP verification
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { otp } = req.body;

    if (!otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'OTP is required for account deletion'
      });
    }

    if (otp.length !== 6) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Invalid OTP format'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'User not found'
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Invalid OTP'
      });
    }

    if (user.otpExpires < new Date()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'OTP has expired'
      });
    }

    // Delete related orders
    await Order.deleteMany({ customer: userId });

    // Delete user account
    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      msg: 'Account and all related data deleted successfully'
    });

  } catch (error) {
    console.error('Delete account error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while deleting account'
    });
  }
};

module.exports = {
  getMyOrders,
  getOrderDetails,
  getAllTailors,
  getTailor,
  getProfile,
  updateProfile,
  sendPasswordChangeOtp,
  updatePassword,
  sendDeleteAccountOtp,
  deleteAccount
};