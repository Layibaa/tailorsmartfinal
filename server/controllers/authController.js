const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

// Update your register function in authController.js

const register = async (req, res) => {
  try {
    const { name, email, password, role, phone, age, gender, weight, height } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new BadRequestError('Email already in use');
    }
    
    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // Prepare user data
    const userData = {
      name,
      email,
      password,
      role: role || 'customer',
      phone,
      otp,
      otpExpires,
      isVerified: false
    };
    
    // If registering as customer and profile data is provided, add it
    if ((role === 'customer' || !role) && (age || gender || weight || height)) {
      userData.customerProfile = {
        ...(age && { age: parseInt(age) }),
        ...(gender && { gender }),
        ...(weight && { weight: parseFloat(weight) }),
        ...(height && { height: parseFloat(height) })
      };
    }
    
    // Create user
    const user = await User.create(userData);
    
    // Send OTP email (your existing email logic here)
    try {
      // Your email sending logic here
      console.log(`OTP for ${email}: ${otp}`); // For development
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue with registration even if email fails
    }
    
    res.status(StatusCodes.CREATED).json({
      message: 'User registered successfully. Please verify your email with the OTP sent.',
      userId: user._id,
      email: user.email
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Login User
const login = async (req, res) => {
  const { email, password } = req.body;

  // Check if email and password were provided
  if (!email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Please provide email and password'
    });
  }

  // Find user by email
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      msg: 'Invalid credentials'
    });
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      msg: 'Invalid credentials'
    });
  }

  // Generate JWT token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' }
  );

  // Return response
  res.status(StatusCodes.OK).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      tailorProfile: user.tailorProfile,
      customerProfile: user.customerProfile
    },
    token
  });
};

// Verify OTP
const verifyOtp = async (req, res) => {
  const { userId, otp } = req.body;

  if (!userId || !otp) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Please provide userId and OTP'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      msg: 'User not found'
    });
  }

  // Check OTP
  if (user.otp !== otp) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Invalid OTP'
    });
  }

  // Check if OTP has expired
  if (user.otpExpires < new Date()) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'OTP has expired'
    });
  }

  // Mark user as verified and clear OTP
  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  // Create a token for the verified user ADDED LATER TO FIX BUG I AM LAIBA MWAHAHAH I AM CRYING MWAHAHAH
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' }
  );
//ALSO HERE THE EXTRA STUFF THAT IM RETURNIGN IS TO FIX BUG
  res.status(StatusCodes.OK).json({
    success: true,
    msg: 'Email verified successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified
    },
    token
  });

};

// Resend OTP
const resendOtp = async (req, res) => {
  const { userId } = req.body;

  if (!userId) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Please provide userId'
    });
  }

  const user = await User.findById(userId);
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      msg: 'User not found'
    });
  }

  // Generate new OTP
  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Update user with new OTP
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  // Send OTP via email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Verify your email',
      text: `Your new OTP is: ${otp}`
    });

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'New OTP sent to your email'
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error sending email. Please try again later.'
    });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Please provide email'
    });
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({
      success: false,
      msg: 'User not found'
    });
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  // Update user with reset token
  user.passwordResetToken = passwordResetToken;
  user.passwordResetExpires = passwordResetExpires;
  await user.save();

  // Send email with reset link
  try {
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      text: `To reset your password, please click on this link: ${resetUrl}. If you did not request this, please ignore this email.`
    });

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Password reset link sent to your email'
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error sending email. Please try again later.'
    });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { resetToken, password } = req.body;

  if (!resetToken || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Please provide reset token and new password'
    });
  }

  // Hash the token for comparison
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Find user with matching token and valid expiry
  const user = await User.findOne({
    passwordResetToken,
    passwordResetExpires: { $gt: new Date() }
  });

  if (!user) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Invalid or expired reset token'
    });
  }

  // Update password and clear reset token fields
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    msg: 'Password reset successful. You can now log in with your new password'
  });
};

// Get Current User
const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
  
  res.status(StatusCodes.OK).json({
    success: true,
    user
  });
};

// Update Password
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Please provide current and new password'
    });
  }

  const user = await User.findById(req.user.id);

  // Verify current password
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Current password is incorrect'
    });
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    msg: 'Password updated successfully'
  });
};

// Add these methods to your existing authController.js

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const user = await User.findById(userId).select('-password -otp -otpExpires -passwordResetToken -passwordResetExpires');
    
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    throw error;
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { name, phone } = req.body;
    
    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    
    // Handle role-specific profile updates
    if (req.user.role === 'customer') {
      const { age, gender, weight, height, address, preferredStyles } = req.body;
      
      updateData.customerProfile = {};
      const existingUser = await User.findById(userId);
      if (existingUser?.customerProfile) {
        updateData.customerProfile = { ...existingUser.customerProfile };
      }
      
      if (age !== undefined) updateData.customerProfile.age = age;
      if (gender !== undefined) updateData.customerProfile.gender = gender;
      if (weight !== undefined) updateData.customerProfile.weight = weight;
      if (height !== undefined) updateData.customerProfile.height = height;
      if (address !== undefined) updateData.customerProfile.address = address;
      if (preferredStyles !== undefined) updateData.customerProfile.preferredStyles = preferredStyles;
    }
    
    if (req.user.role === 'tailor') {
      const { experience, specialization, shopName, shopAddress, pricing } = req.body;
      
      updateData.tailorProfile = {};
      const existingUser = await User.findById(userId);
      if (existingUser?.tailorProfile) {
        updateData.tailorProfile = { ...existingUser.tailorProfile };
      }
      
      if (experience !== undefined) updateData.tailorProfile.experience = experience;
      if (specialization !== undefined) updateData.tailorProfile.specialization = specialization;
      if (shopName !== undefined) updateData.tailorProfile.shopName = shopName;
      if (shopAddress !== undefined) updateData.tailorProfile.shopAddress = shopAddress;
      if (pricing !== undefined) updateData.tailorProfile.pricing = pricing;
    }
    
    // Save updates
    const user = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true
    }).select('-password -otp -otpExpires -passwordResetToken -passwordResetExpires');
    
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'User not found'
      });
    }
    
    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error updating profile'
    });
  }
};

module.exports = {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updatePassword,
  getProfile,
  updateProfile,
};