// ====================
// server/controllers/adminAuthController.js
// ====================
const Admin = require('../models/Admin');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

// Admin login
const adminLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Please provide email and password'
    });
  }

  try {
    // Find admin by email
    const admin = await Admin.findOne({ email, isActive: true });
    
    if (!admin) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (admin.isLocked()) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Account is locked due to too many failed login attempts. Try again later.'
      });
    }

    // Compare password
    const isMatch = await admin.comparePassword(password);
    
    if (!isMatch) {
      await admin.incLoginAttempts();
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
      await admin.resetLoginAttempts();
    }

    // Generate tokens
    const { accessToken, refreshToken } = admin.generateTokens();
    
    // Store refresh token
    admin.refreshTokens.push(refreshToken);
    admin.lastLogin = new Date();
    await admin.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Login successful',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        permissions: admin.permissions
      },
      accessToken,
      refreshToken
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
};

// Refresh access token
const refreshToken = async (req, res) => {
  const { authorization } = req.headers;
  
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'No refresh token provided'
    });
  }

  const token = authorization.split(' ')[1];

  try {
    // Verify refresh token
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    
    // Find admin and check if refresh token exists
    const admin = await Admin.findById(decoded.id);
    
    if (!admin || !admin.refreshTokens.includes(token) || !admin.isActive) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = jwt.sign(
      { 
        id: admin._id, 
        role: admin.role, 
        permissions: admin.permissions 
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.status(StatusCodes.OK).json({
      success: true,
      accessToken: newAccessToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Admin logout
const adminLogout = async (req, res) => {
  const { authorization } = req.headers;
  
  if (authorization && authorization.startsWith('Bearer ')) {
    const refreshToken = authorization.split(' ')[1];
    
    try {
      // Find admin and remove refresh token
      await Admin.findByIdAndUpdate(req.admin.id, {
        $pull: { refreshTokens: refreshToken }
      });
    } catch (error) {
      console.error('Logout error:', error);
    }
  }

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// Logout from all devices
const logoutAll = async (req, res) => {
  try {
    // Clear all refresh tokens
    await Admin.findByIdAndUpdate(req.admin.id, {
      refreshTokens: []
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Logged out from all devices successfully'
    });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to logout from all devices'
    });
  }
};

// Get current admin
const getCurrentAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id)
      .select('-password -refreshTokens -passwordResetToken');
    
    if (!admin) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      admin
    });
  } catch (error) {
    console.error('Get current admin error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to get admin details'
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Please provide current and new password'
    });
  }

  if (newPassword.length < 6) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'New password must be at least 6 characters long'
    });
  }

  try {
    const admin = await Admin.findById(req.admin.id);
    
    // Verify current password
    const isMatch = await admin.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    admin.password = newPassword;
    
    // Clear all refresh tokens to force re-login on all devices
    admin.refreshTokens = [];
    
    await admin.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password updated successfully. Please login again.'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update password'
    });
  }
};

// Forgot password - send reset link
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Please provide email address'
    });
  }

  try {
    const admin = await Admin.findOne({ email, isActive: true });
    
    if (!admin) {
      // Don't reveal if email exists or not
      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update admin with reset token
    admin.passwordResetToken = passwordResetToken;
    admin.passwordResetExpires = passwordResetExpires;
    await admin.save();

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get('host')}/admin/reset-password/${resetToken}`;
    
    // Send email
    try {
      await sendEmail({
        to: admin.email,
        subject: 'TailorSmart Admin - Password Reset Request',
        html: `
          <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>Hello ${admin.name},</p>
            <p>You requested a password reset for your TailorSmart admin account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p><strong>This link will expire in 10 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            <p>For security reasons, this link can only be used once.</p>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #666;">
              TailorSmart Admin Panel<br>
              This is an automated message, please do not reply.
            </p>
          </div>
        `,
        text: `
          Hello ${admin.name},
          
          You requested a password reset for your TailorSmart admin account.
          
          Reset your password by visiting: ${resetUrl}
          
          This link will expire in 10 minutes.
          
          If you didn't request this password reset, please ignore this email.
        `
      });

      res.status(StatusCodes.OK).json({
        success: true,
        message: 'Password reset link sent to your email address.'
      });

    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Clear reset token if email fails
      admin.passwordResetToken = undefined;
      admin.passwordResetExpires = undefined;
      await admin.save();

      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to process password reset request'
    });
  }
};

// Reset password with token
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!token || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Please provide reset token and new password'
    });
  }

  if (password.length < 6) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Password must be at least 6 characters long'
    });
  }

  try {
    // Hash the token for comparison
    const passwordResetToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find admin with matching token and valid expiry
    const admin = await Admin.findOne({
      passwordResetToken,
      passwordResetExpires: { $gt: new Date() },
      isActive: true
    });

    if (!admin) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password and clear reset token fields
    admin.password = password;
    admin.passwordResetToken = undefined;
    admin.passwordResetExpires = undefined;
    
    // Clear all refresh tokens to force re-login
    admin.refreshTokens = [];
    
    await admin.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password reset successful. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to reset password'
    });
  }
};

// Update admin profile
const updateProfile = async (req, res) => {
  const { name } = req.body;
  const allowedUpdates = ['name'];
  const updates = {};

  // Only allow certain fields to be updated
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  if (Object.keys(updates).length === 0) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'No valid fields to update'
    });
  }

  try {
    const admin = await Admin.findByIdAndUpdate(
      req.admin.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -passwordResetToken');

    if (!admin) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Admin not found'
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Profile updated successfully',
      admin
    });

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => e.message);
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// Get admin activity log
const getActivityLog = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    
    // This would typically come from a separate ActivityLog model
    // For now, return a placeholder response
    const activities = [
      {
        action: 'Login',
        timestamp: new Date(),
        ip: req.ip,
        userAgent: req.get('User-Agent')
      }
    ];

    res.status(StatusCodes.OK).json({
      success: true,
      activities,
      pagination: {
        current: parseInt(page),
        pages: 1,
        total: activities.length
      }
    });

  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch activity log'
    });
  }
};

module.exports = {
  adminLogin,
  refreshToken,
  adminLogout,
  logoutAll,
  getCurrentAdmin,
  changePassword,
  forgotPassword,
  resetPassword,
  updateProfile,
  getActivityLog
};