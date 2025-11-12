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
    
    console.log('🔐 Sending delete account OTP for user:', userId);
    
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

    console.log('📧 Generated OTP for delete account:', otp);
    console.log('📧 User email:', user.email);

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save();

    console.log('✅ OTP saved to database');

    // Send OTP email
    try {
      await sendEmail({
        to: user.email,
        subject: '⚠️ Account Deletion OTP - Tailor Smart',
        text: `Your OTP for account deletion is: ${otp}\n\nThis OTP will expire in 10 minutes.\n\nIf you did not request this, please ignore this email and change your password immediately.`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              .otp-box { background-color: white; border: 2px dashed #EF4444; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
              .otp-code { font-size: 32px; font-weight: bold; color: #EF4444; letter-spacing: 5px; }
              .warning { background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0; }
              .footer { text-align: center; color: #666; margin-top: 20px; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚠️ Account Deletion Request</h1>
              </div>
              <div class="content">
                <h2>Hello ${user.name},</h2>
                <p>We received a request to delete your Tailor Smart account.</p>
                
                <div class="otp-box">
                  <p style="margin: 0; font-size: 14px; color: #666;">Your verification code is:</p>
                  <div class="otp-code">${otp}</div>
                  <p style="margin: 10px 0 0 0; font-size: 12px; color: #999;">Valid for 10 minutes</p>
                </div>
                
                <div class="warning">
                  <strong>⚠️ Important:</strong>
                  <ul style="margin: 10px 0 0 0;">
                    <li>This action is <strong>permanent and cannot be undone</strong></li>
                    <li>All your orders and data will be permanently deleted</li>
                    <li>If you didn't request this, please ignore this email and change your password immediately</li>
                  </ul>
                </div>
                
                <p style="margin-top: 20px;">
                  <strong>Need help?</strong> Contact our support team if you have any questions.
                </p>
              </div>
              <div class="footer">
                <p>This is an automated email from Tailor Smart. Please do not reply.</p>
              </div>
            </div>
          </body>
          </html>
        `
      });

      console.log('✅ Email sent successfully to:', user.email);

      res.json({
        success: true,
        msg: 'OTP sent to your email for account deletion verification. Please check your inbox.'
      });

    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      
      // For development - return OTP in response
      if (process.env.NODE_ENV === 'development') {
        return res.json({
          success: true,
          msg: 'OTP generated (Email service unavailable - using dev mode)',
          devOtp: otp, // Only in development
          note: 'Check console for email preview URL'
        });
      }
      
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        msg: 'Failed to send OTP email. Please try again or contact support.'
      });
    }

  } catch (error) {
    console.error('❌ Send delete account OTP error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while sending OTP. Please try again.'
    });
  }
};

// Delete account with OTP verification
const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { otp } = req.body;

    console.log('🗑️ Delete account attempt:', { userId, receivedOtp: otp });

    // Validate OTP input
    if (!otp) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'OTP is required for account deletion'
      });
    }

    if (otp.length !== 6) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'OTP must be 6 digits'
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'User not found'
      });
    }

    console.log('📋 User found:', {
      id: user._id,
      email: user.email,
      storedOtp: user.otp,
      otpExpires: user.otpExpires
    });

    // Check if OTP exists
    if (!user.otp || !user.otpExpires) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'No OTP found. Please request a new OTP.'
      });
    }

    // Verify OTP
    if (user.otp !== otp) {
      console.log('❌ OTP mismatch:', {
        provided: otp,
        stored: user.otp
      });
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Invalid OTP. Please check and try again.'
      });
    }

    // Check OTP expiration
    if (user.otpExpires < new Date()) {
      console.log('❌ OTP expired:', {
        expiresAt: user.otpExpires,
        now: new Date()
      });
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'OTP has expired. Please request a new OTP.'
      });
    }

    console.log('✅ OTP verified successfully');

    // Delete related data
    try {
      // Delete all orders
      const deletedOrders = await Order.deleteMany({ customer: userId });
      console.log(`🗑️ Deleted ${deletedOrders.deletedCount} orders`);

      // Delete user account
      await User.findByIdAndDelete(userId);
      console.log('✅ User account deleted successfully');

      // Send confirmation email (optional, best effort)
      try {
        await sendEmail({
          to: user.email,
          subject: 'Account Deleted - Tailor Smart',
          text: `Your Tailor Smart account has been permanently deleted. We're sorry to see you go.\n\nIf this was a mistake, please contact our support team immediately.`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #6B7280; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Account Deleted</h1>
                </div>
                <div class="content">
                  <h2>Goodbye, ${user.name}</h2>
                  <p>Your Tailor Smart account has been permanently deleted as requested.</p>
                  <p>All your data, including orders and profile information, has been removed from our system.</p>
                  <p>If this was a mistake or you need assistance, please contact our support team immediately.</p>
                  <p style="margin-top: 30px;">Thank you for using Tailor Smart.</p>
                </div>
              </div>
            </body>
            </html>
          `
        });
      } catch (emailError) {
        console.error('⚠️ Failed to send deletion confirmation email:', emailError);
        // Don't fail the deletion if email fails
      }

      res.json({
        success: true,
        msg: 'Account and all related data deleted successfully'
      });

    } catch (deleteError) {
      console.error('❌ Error during deletion:', deleteError);
      throw deleteError;
    }

  } catch (error) {
    console.error('❌ Delete account error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Server error while deleting account. Please try again or contact support.'
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