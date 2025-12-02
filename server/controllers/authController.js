// server/controllers/authController.js - FIXED registration to save tailor fields correctly
const User = require('../models/User');
const { StatusCodes } = require('http-status-codes');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendEmail } = require('../utils/emailService');

const VALID_CITIES = ['Islamabad', 'Karachi', 'Lahore', 'Peshawar', 'Quetta'];
const ISLAMABAD_REGIONS = [
  'Blue Area', 'F-6', 'F-7', 'F-8', 'F-10', 
  'G-6', 'G-7', 'G-8', 'G-10', 'H-8', 'I-8', 
  'Bahria Town', 'DHA', 'Rawat', 'Tarlai',
  'E-7', 'E-11', 'G-9', 'G-11', 'I-9', 'I-10'
];

const validateLocation = (city, region) => {
  if (!city || !VALID_CITIES.includes(city)) {
    return { 
      isValid: false, 
      error: `City must be one of: ${VALID_CITIES.join(', ')}` 
    };
  }
  
  if (city === 'Islamabad') {
    if (!region || !ISLAMABAD_REGIONS.includes(region)) {
      return { 
        isValid: false, 
        error: `For Islamabad, region must be one of: ${ISLAMABAD_REGIONS.join(', ')}` 
      };
    }
  } else {
    if (region && region.trim() !== '') {
      return { 
        isValid: false, 
        error: 'Region should only be provided for Islamabad' 
      };
    }
  }
  
  return { isValid: true };
};

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { 
      userId: user._id,
      id: user._id,
      role: user.role 
    },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '30d' }
  );

  const refreshToken = jwt.sign(
    { 
      userId: user._id,
      type: 'refresh' 
    },
    process.env.JWT_REFRESH_SECRET || 'refresh_secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Please provide email and password'
    });
  }

  const user = await User.findOne({ email });
  if (!user || user.status !== 'active') {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      msg: 'Invalid credentials'
    });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      msg: 'Invalid credentials'
    });
  }

  const { accessToken, refreshToken } = generateTokens(user);
  
  user.refreshToken = refreshToken;
  user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  user.lastLogin = new Date();
  user.loginCount += 1;
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isVerified: user.isVerified,
      city: user.city,
      region: user.region,
      tailorProfile: user.tailorProfile,
      customerProfile: user.customerProfile
    },
    token: accessToken,
    accessToken,
    refreshToken
  });
};

//  FIXED: Register function with correct field mapping
const register = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      phone, 
      city,
      region,
      // Customer profile fields
      age, 
      gender, 
      weight, 
      height,
      // Tailor profile fields - FIXED names
      shopName,
      shopLocation,
      shopAddress,      //  accept both
      averagePrice,     //  FIXED: was missing
      experience,
      specialization
    } = req.body;
    
    console.log('📝 Registration data received:', {
      role,
      shopName,
      shopLocation,
      shopAddress,
      averagePrice
    });
    
    if (!name || !email || !password || !city) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Please provide name, email, password, and city'
      });
    }
    
    const locationValidation = validateLocation(city, region);
    if (!locationValidation.isValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: locationValidation.error
      });
    }
    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: 'Email already in use'
      });
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    
    const userData = {
      name,
      email,
      password,
      role: role || 'customer',
      phone,
      city,
      region: city === 'Islamabad' ? region : null,
      otp,
      otpExpires,
      isVerified: false
    };
    
    //  FIXED: Add role-specific profile data with correct field names
    if (role === 'customer' || !role) {
      if (age || gender || weight || height) {
        userData.customerProfile = {};
        
        if (age) {
          userData.customerProfile.age = parseInt(age);
        }
        if (gender) {
          userData.customerProfile.gender = gender;
        }
        if (weight) {
          userData.customerProfile.weight = parseFloat(weight);
        }
        if (height) {
          userData.customerProfile.height = parseFloat(height);
        }
        
        console.log(' Customer profile to save:', userData.customerProfile);
      }
    } else if (role === 'tailor') {
      //  FIXED: Build tailor profile with all fields
      if (shopName || shopLocation || shopAddress || averagePrice || experience || specialization) {
        userData.tailorProfile = {};
        
        if (shopName) {
          userData.tailorProfile.shopName = shopName;
        }
        
        //  Handle both shopLocation and shopAddress
        const location = shopLocation || shopAddress;
        if (location) {
          userData.tailorProfile.shopLocation = location;
          userData.tailorProfile.shopAddress = location;
        }
        
        //  FIXED: Save averagePrice
        if (averagePrice) {
          userData.tailorProfile.averagePrice = parseFloat(averagePrice);
        }
        
        if (experience) {
          userData.tailorProfile.experience = parseInt(experience);
        }
        
        if (specialization) {
          userData.tailorProfile.specialization = specialization;
        }
        
        console.log(' Tailor profile to save:', userData.tailorProfile);
      }
    }
    
    // Create user
    const user = await User.create(userData);
    console.log(' User created with tailor profile:', user.tailorProfile);
    
    // Send OTP email
    try {
      if (typeof sendEmail === 'function') {
        await sendEmail({
          to: user.email,
          subject: 'Verify your email - Tailor Smart',
          text: `Welcome to Tailor Smart! Your OTP for email verification is: ${otp}. This OTP will expire in 10 minutes.`
        });
      } else {
        console.log(`OTP for ${email}: ${otp}`);
      }
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }
    
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `User registered successfully in ${city}${region ? `, ${region}` : ''}. Please verify your email with the OTP sent.`,
      userId: user._id,
      email: user.email,
      location: {
        city: user.city,
        region: user.region
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: validationErrors.join(', ')
      });
    }
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error during registration'
    });
  }
};

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

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  const { accessToken } = generateTokens(user);

  res.status(StatusCodes.OK).json({
    success: true,
    msg: 'Email verified successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
      city: user.city,
      region: user.region,
      tailorProfile: user.tailorProfile,    //  Include full profile
      customerProfile: user.customerProfile
    },
    token: accessToken
  });
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { 
      name, 
      email,  //  ADDED: email support
      phone, 
      city,
      region
    } = req.body;
    
    if (city || region) {
      const currentUser = await User.findById(userId);
      const newCity = city || currentUser.city;
      const newRegion = region || currentUser.region;
      
      const locationValidation = validateLocation(newCity, newRegion);
      if (!locationValidation.isValid) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          msg: locationValidation.error
        });
      }
    }
    
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email; //  ADDED
    if (phone) updateData.phone = phone;
    if (city) {
      updateData.city = city;
      if (city !== 'Islamabad') {
        updateData.region = null;
      }
    }
    if (region !== undefined) {
      updateData.region = region || null;
    }
    
    if (req.user.role === 'customer') {
      const { age, gender, weight, height, preferredStyles } = req.body;
      //  REMOVED: address field
      
      if (age !== undefined || gender !== undefined || weight !== undefined || 
          height !== undefined || preferredStyles !== undefined) {
        updateData.customerProfile = {};
        const existingUser = await User.findById(userId);
        if (existingUser?.customerProfile) {
          updateData.customerProfile = { ...existingUser.customerProfile };
        }
        
        if (age !== undefined) updateData.customerProfile.age = age;
        if (gender !== undefined) updateData.customerProfile.gender = gender;
        if (weight !== undefined) updateData.customerProfile.weight = weight;
        if (height !== undefined) updateData.customerProfile.height = height;
        //  REMOVED: address handling
        if (preferredStyles !== undefined) updateData.customerProfile.preferredStyles = preferredStyles;
      }
    }
    
    if (req.user.role === 'tailor') {
      const { experience, specialization, shopName, shopAddress, pricing } = req.body;
      
      if (experience !== undefined || specialization !== undefined || 
          shopName !== undefined || shopAddress !== undefined || pricing !== undefined) {
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
    }
    
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
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        msg: validationErrors.join(', ')
      });
    }
    
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error updating profile'
    });
  }
};

const getLocationOptions = async (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      locations: {
        cities: VALID_CITIES,
        islamabadRegions: ISLAMABAD_REGIONS
      }
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error fetching location options'
    });
  }
};

// Keep all other existing functions (refreshToken, logout, whoami, etc.)
const refreshToken = async (req, res) => {
  const { refreshToken: token } = req.body;

  if (!token) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Refresh token required'
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET || 'refresh_secret');
    
    if (payload.type !== 'refresh') {
      throw new Error('Invalid token type');
    }

    const user = await User.findOne({
      _id: payload.id,
      refreshToken: token,
      refreshTokenExpires: { $gt: new Date() },
      status: 'active'
    });

    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        success: false,
        msg: 'Invalid or expired refresh token'
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    user.refreshToken = newRefreshToken;
    user.refreshTokenExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      accessToken,
      refreshToken: newRefreshToken
    });

  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      success: false,
      msg: 'Invalid or expired refresh token'
    });
  }
};

const logout = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;
    
    if (token) {
      await User.updateOne(
        { refreshToken: token },
        { 
          $unset: { 
            refreshToken: 1, 
            refreshTokenExpires: 1 
          } 
        }
      );
    }

    res.status(StatusCodes.OK).json({
      success: true,
      msg: 'Logged out successfully'
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error during logout'
    });
  }
};

const whoami = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password -refreshToken -otp -otpExpires -passwordResetToken -passwordResetExpires');
    
    res.status(StatusCodes.OK).json({
      success: true,
      user,
      role: req.user.role,
      permissions: {
        canManageUsers: ['superadmin', 'admin'].includes(req.user.role),
        canManageOrders: ['superadmin', 'admin', 'support'].includes(req.user.role),
        canViewAnalytics: ['superadmin', 'admin'].includes(req.user.role)
      }
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error fetching user data'
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    
    const user = await User.findById(userId).select('-password -otp -otpExpires -passwordResetToken -passwordResetExpires');
    
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        msg: 'User not found'
      });
    }
    
    res.status(StatusCodes.OK).json({ 
      success: true,
      user 
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: 'Error fetching user profile'
    });
  }
};

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

  const otp = crypto.randomInt(100000, 999999).toString();
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  try {
    if (typeof sendEmail === 'function') {
      await sendEmail({
        to: user.email,
        subject: 'Verify your email - Tailor Smart',
        text: `Your new OTP is: ${otp}`
      });
    } else {
      console.log(`New OTP for ${user.email}: ${otp}`);
    }

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

  const resetToken = crypto.randomBytes(32).toString('hex');
  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  
  const passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  user.passwordResetToken = passwordResetToken;
  user.passwordResetExpires = passwordResetExpires;
  await user.save();

  try {
    const resetUrl = `${req.protocol}://${req.get('host')}/api/v1/auth/reset-password/${resetToken}`;
    
    if (typeof sendEmail === 'function') {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request - Tailor Smart',
        text: `To reset your password, please click on this link: ${resetUrl}. If you did not request this, please ignore this email.`
      });
    } else {
      console.log(`Reset URL for ${user.email}: ${resetUrl}`);
    }

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

const resetPassword = async (req, res) => {
  const { resetToken, password } = req.body;

  if (!resetToken || !password) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Please provide reset token and new password'
    });
  }

  const passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

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

  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    msg: 'Password reset successful. You can now log in with your new password'
  });
};

const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.id).select('-password -otp -otpExpires');
  
  res.status(StatusCodes.OK).json({
    success: true,
    user
  });
};

const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Please provide current and new password'
    });
  }

  const user = await User.findById(req.user.id);

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      msg: 'Current password is incorrect'
    });
  }

  user.password = newPassword;
  await user.save();

  res.status(StatusCodes.OK).json({
    success: true,
    msg: 'Password updated successfully'
  });
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  whoami,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getCurrentUser,
  updatePassword,
  getProfile,
  updateProfile,
  getLocationOptions,
};