const TailorProfile = require('../models/TailorProfile');
const User = require('../models/User');

// @desc    Get all tailors
// @route   GET /api/tailors
// @access  Public
exports.getTailors = async (req, res, next) => {
  try {
    // Find all users with role 'tailor' and their tailor profiles
    const tailorProfiles = await TailorProfile.find()
      .populate({
        path: 'user',
        select: 'name email phone',
        match: { role: 'tailor' },
      })
      .sort({ rating: -1 });

    // Filter out any profiles where user is null (role mismatch)
    const validProfiles = tailorProfiles.filter(profile => profile.user !== null);

    res.status(200).json({
      success: true,
      count: validProfiles.length,
      data: validProfiles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured tailors (top rated)
// @route   GET /api/tailors/featured
// @access  Public
exports.getFeaturedTailors = async (req, res, next) => {
  try {
    // Get top 5 rated tailors
    const featuredTailors = await TailorProfile.find()
      .populate({
        path: 'user',
        select: 'name email phone',
        match: { role: 'tailor' },
      })
      .sort({ rating: -1 })
      .limit(5);

    // Filter out any profiles where user is null
    const validProfiles = featuredTailors.filter(profile => profile.user !== null);

    res.status(200).json({
      success: true,
      count: validProfiles.length,
      data: validProfiles,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get tailor profile by ID
// @route   GET /api/tailors/:id
// @access  Public
exports.getTailorById = async (req, res, next) => {
  try {
    const tailorProfile = await TailorProfile.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'name email phone',
      });

    if (!tailorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: tailorProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current tailor's profile
// @route   GET /api/tailors/profile
// @access  Private (Tailor only)
exports.getTailorProfile = async (req, res, next) => {
  try {
    // Check if user is a tailor
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'tailor') {
      return res.status(403).json({
        success: false,
        message: 'Only tailors can access this resource',
      });
    }

    const tailorProfile = await TailorProfile.findOne({ user: req.user.id });

    if (!tailorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found',
      });
    }

    res.status(200).json({
      success: true,
      data: tailorProfile,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update tailor profile
// @route   PUT /api/tailors/profile
// @access  Private (Tailor only)
exports.updateTailorProfile = async (req, res, next) => {
  try {
    // Check if user is a tailor
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'tailor') {
      return res.status(403).json({
        success: false,
        message: 'Only tailors can access this resource',
      });
    }

    const { shopName, location, priceRange, description, specialties, experience } = req.body;

    // Find tailor profile or create if not exists
    let tailorProfile = await TailorProfile.findOne({ user: req.user.id });

    if (!tailorProfile) {
      // Create new profile
      tailorProfile = new TailorProfile({
        user: req.user.id,
        shopName: shopName || `${user.name}'s Tailoring`,
        location: location || 'Not specified',
        priceRange: priceRange || 'Not specified',
        rating: 0,
      });
    } else {
      // Update existing profile
      if (shopName) tailorProfile.shopName = shopName;
      if (location) tailorProfile.location = location;
      if (priceRange) tailorProfile.priceRange = priceRange;
      if (description !== undefined) tailorProfile.description = description;
      if (specialties) tailorProfile.specialties = specialties;
      if (experience) tailorProfile.experience = experience;
    }

    await tailorProfile.save();

    res.status(200).json({
      success: true,
      data: tailorProfile,
      message: 'Tailor profile updated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add featured work to tailor profile
// @route   POST /api/tailors/profile/work
// @access  Private (Tailor only)
exports.addFeaturedWork = async (req, res, next) => {
  try {
    // Check if user is a tailor
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'tailor') {
      return res.status(403).json({
        success: false,
        message: 'Only tailors can access this resource',
      });
    }

    const { title, description, imageUrl } = req.body;

    if (!title || !imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and image URL',
      });
    }

    const tailorProfile = await TailorProfile.findOne({ user: req.user.id });

    if (!tailorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found',
      });
    }

    // Add new work
    tailorProfile.featuredWork.push({
      title,
      description,
      imageUrl,
    });

    await tailorProfile.save();

    res.status(201).json({
      success: true,
      data: tailorProfile.featuredWork,
      message: 'Featured work added successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove featured work from tailor profile
// @route   DELETE /api/tailors/profile/work/:workId
// @access  Private (Tailor only)
exports.removeFeaturedWork = async (req, res, next) => {
  try {
    // Check if user is a tailor
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'tailor') {
      return res.status(403).json({
        success: false,
        message: 'Only tailors can access this resource',
      });
    }

    const tailorProfile = await TailorProfile.findOne({ user: req.user.id });

    if (!tailorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Tailor profile not found',
      });
    }

    // Remove work by ID
    tailorProfile.featuredWork = tailorProfile.featuredWork.filter(
      work => work._id.toString() !== req.params.workId
    );

    await tailorProfile.save();

    res.status(200).json({
      success: true,
      data: tailorProfile.featuredWork,
      message: 'Featured work removed successfully',
    });
  } catch (error) {
    next(error);
  }
};
