const User = require('../models/User');
const TailorProfile = require('../models/TailorProfile');

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
exports.getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gender: user.gender,
        age: user.age,
        height: user.height,
        weight: user.weight,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
exports.updateUserProfile = async (req, res, next) => {
  try {
    const { name, email, phone, gender, age, height, weight } = req.body;

    // Check if email is taken
    if (email) {
      const emailTaken = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (emailTaken) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken',
        });
      }
    }

    // Find and update user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (gender !== undefined) user.gender = gender;
    if (age !== undefined) user.age = age;
    if (height !== undefined) user.height = height;
    if (weight !== undefined) user.weight = weight;

    await user.save();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        gender: user.gender,
        age: user.age,
        height: user.height,
        weight: user.weight,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user settings
// @route   PUT /api/users/settings
// @access  Private
exports.updateUserSettings = async (req, res, next) => {
  try {
    const { pushNotifications, emailNotifications, orderUpdates, chatNotifications } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update notification settings
    if (pushNotifications !== undefined) user.settings.pushNotifications = pushNotifications;
    if (emailNotifications !== undefined) user.settings.emailNotifications = emailNotifications;
    if (orderUpdates !== undefined) user.settings.orderUpdates = orderUpdates;
    if (chatNotifications !== undefined) user.settings.chatNotifications = chatNotifications;

    await user.save();

    res.status(200).json({
      success: true,
      data: user.settings,
      message: 'Settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Change user password
// @route   PUT /api/users/password
// @access  Private
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validate
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current password and new password',
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if current password matches
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
exports.deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // If user is a tailor, delete tailor profile
    if (user.role === 'tailor') {
      await TailorProfile.findOneAndDelete({ user: user._id });
    }

    // Delete user
    await user.remove();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};