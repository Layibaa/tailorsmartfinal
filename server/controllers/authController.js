const jwt = require('jsonwebtoken');
const { User, Customer, Tailor, Admin } = require('../models/User');
const OTP = require('../models/OTP');
const otpService = require('../services/otpService');
const { validatePassword, validateMobileNumber, validateOTP, formatMobileNumber, validateEmail, validateEmailWithFeedback } = require('../utils/validationUtils');

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'tailorsmart_jwt_secret', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (customer or tailor)
// @route   POST /api/auth/signup
// @access  Public
const signup = async (req, res) => {
  try {
    const { email, mobileNumber, password, role, ...otherDetails } = req.body;
    
    // Validate email
    const emailValidation = validateEmailWithFeedback(email);
    if (!emailValidation.isValid) {
      return res.status(400).json({ message: emailValidation.message });
    }

    // Check if user already exists with this email
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Validate mobile number if provided
    let formattedMobileNumber = null;
    if (mobileNumber) {
      const mobileValidation = validateMobileNumber(mobileNumber);
      if (!mobileValidation.isValid) {
        return res.status(400).json({ message: mobileValidation.message });
      }
      formattedMobileNumber = mobileValidation.cleanedNumber;
      
      // Check if user already exists with this mobile number
      const mobileExists = await User.findOne({ mobileNumber: formattedMobileNumber });
      if (mobileExists) {
        return res.status(400).json({ message: 'User with this mobile number already exists' });
      }
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    let user;

    // Create user based on role
    if (role === 'customer') {
      const { gender, age, height, weight } = otherDetails;
      
      // Check required fields
      if (!gender || !age || !height || !weight) {
        return res.status(400).json({ message: 'All customer fields are required' });
      }
      
      user = await Customer.create({
        email,
        mobileNumber: formattedMobileNumber, // Optional mobile number
        password,
        gender,
        age,
        height,
        weight,
      });
    } else if (role === 'tailor') {
      const { shopName, location, priceRange } = otherDetails;
      
      // Check required fields
      if (!shopName || !location) {
        return res.status(400).json({ message: 'Shop name and location are required' });
      }
      
      // Check and format priceRange
      let formattedPriceRange = {
        min: 0,
        max: 0
      };
      
      if (priceRange) {
        if (typeof priceRange === 'object') {
          formattedPriceRange.min = Number(priceRange.min) || 0;
          formattedPriceRange.max = Number(priceRange.max) || 0;
        } else if (typeof priceRange === 'string') {
          // Try to parse if it's a JSON string
          try {
            const parsedRange = JSON.parse(priceRange);
            formattedPriceRange.min = Number(parsedRange.min) || 0;
            formattedPriceRange.max = Number(parsedRange.max) || 0;
          } catch (e) {
            console.error('Error parsing priceRange:', e);
            // Default values will be used
          }
        }
      }
      
      // Ensure min is less than max
      if (formattedPriceRange.min > formattedPriceRange.max) {
        const temp = formattedPriceRange.min;
        formattedPriceRange.min = formattedPriceRange.max;
        formattedPriceRange.max = temp;
      }
      
      user = await Tailor.create({
        email,
        mobileNumber: formattedMobileNumber, // Optional mobile number
        password,
        shopName,
        location,
        priceRange: formattedPriceRange,
      });
    } else {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Generate and send OTP for verification via email
    const otpResult = await otpService.sendOTP(email);

    let responseMessage = 'User registered successfully. Please verify your email address.';
    
    // Check for OTP sending errors
    if (otpResult && !otpResult.success) {
      responseMessage += ' ' + otpResult.message;
      // Include debug OTP for testing in development
      if (process.env.NODE_ENV !== 'production' && otpResult.debug) {
        console.log(`Debug OTP for ${email}: ${otpResult.debug.otp}`);
      }
    }

    // Prepare response object
    const response = {
      message: responseMessage,
    };
    
    // In non-production environments, include the OTP in the response
    // for testing purposes
    if (process.env.NODE_ENV !== 'production' && otpResult && otpResult.debug) {
      response.debug = {
        note: 'This is only included in development/testing environments',
        otp: otpResult.debug.otp,
        email
      };
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate a user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is verified
    if (!user.isVerified) {
      // Generate and send OTP for verification via email
      const otpResult = await otpService.sendOTP(email);
      
      let responseMessage = 'Account not verified. A verification code has been sent to your email.';
      
      // Check for OTP sending errors
      if (otpResult && !otpResult.success) {
        responseMessage += ' ' + otpResult.message;
        // Include debug OTP for testing in development
        if (process.env.NODE_ENV !== 'production' && otpResult.debug) {
          console.log(`Debug OTP for ${email}: ${otpResult.debug.otp}`);
        }
      }

      // Prepare response object
      const response = {
        message: responseMessage,
        requiresVerification: true,
        email,
      };
      
      // In non-production environments, include the OTP in the response
      // for testing purposes
      if (process.env.NODE_ENV !== 'production' && otpResult && otpResult.debug) {
        response.debug = {
          note: 'This is only included in development/testing environments',
          otp: otpResult.debug.otp
        };
      }

      return res.status(403).json(response);
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data without sensitive information
    res.json({
      token,
      user: {
        _id: user._id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        ...(user.role === 'customer' && {
          gender: user.gender,
          age: user.age,
          height: user.height,
          weight: user.weight,
        }),
        ...(user.role === 'tailor' && {
          shopName: user.shopName,
          location: user.location,
          priceRange: user.priceRange,
        }),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Authenticate admin & get token
// @route   POST /api/auth/admin-login
// @access  Public
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Hardcoded admin credentials for the example
    // In a production environment, these should be stored in the database
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

    // Check if credentials match
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    // Find or create admin user
    let admin = await Admin.findOne({ username });

    if (!admin) {
      // Create admin user if it doesn't exist
      admin = await Admin.create({
        username,
        password: ADMIN_PASSWORD, // Will be hashed by the pre-save hook
        mobileNumber: 'admin', // Placeholder, not used for admin
        isVerified: true,
      });
    }

    // Generate JWT token
    const token = generateToken(admin._id);

    res.json({
      token,
      user: {
        _id: admin._id,
        username: admin.username,
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate OTP format
    const otpValidation = validateOTP(otp);
    if (!otpValidation.isValid) {
      return res.status(400).json({ message: otpValidation.message });
    }

    // Find the OTP record
    const otpRecord = await OTP.findOne({ email });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Verification code expired or not found. Please request a new code.' });
    }

    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }

    // Find the user
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Mark user as verified
    user.isVerified = true;
    await user.save();

    // Delete the OTP record
    await OTP.deleteOne({ _id: otpRecord._id });

    // Generate JWT token
    const token = generateToken(user._id);

    res.json({
      message: 'Email verified successfully',
      token,
      user: {
        _id: user._id,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        ...(user.role === 'customer' && {
          gender: user.gender,
          age: user.age,
          height: user.height,
          weight: user.weight,
        }),
        ...(user.role === 'tailor' && {
          shopName: user.shopName,
          location: user.location,
          priceRange: user.priceRange,
        }),
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Request forgot password OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate and send OTP via email
    const otpResult = await otpService.sendOTP(email);
    
    let responseMessage = 'Verification code sent to your email';
    
    // Check for OTP sending errors
    if (otpResult && !otpResult.success) {
      responseMessage += '. ' + otpResult.message;
      // Include debug OTP for testing in development
      if (process.env.NODE_ENV !== 'production' && otpResult.debug) {
        console.log(`Debug OTP for ${email}: ${otpResult.debug.otp}`);
      }
    }

    // Prepare response object
    const response = {
      message: responseMessage,
      email,
    };
    
    // In non-production environments, include the OTP in the response
    // for testing purposes
    if (process.env.NODE_ENV !== 'production' && otpResult && otpResult.debug) {
      response.debug = {
        note: 'This is only included in development/testing environments',
        otp: otpResult.debug.otp
      };
    }

    res.json(response);
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Reset password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Validate OTP if provided
    if (otp) {
      const otpValidation = validateOTP(otp);
      if (!otpValidation.isValid) {
        return res.status(400).json({ message: otpValidation.message });
      }
      
      // Find the OTP record
      const otpRecord = await OTP.findOne({ email });
      if (!otpRecord) {
        return res.status(400).json({ message: 'Verification code expired or not found. Please request a new code.' });
      }
      
      // Check if OTP matches
      if (otpRecord.otp !== otp) {
        return res.status(400).json({ message: 'Invalid verification code' });
      }
      
      // Delete the OTP record
      await OTP.deleteOne({ _id: otpRecord._id });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ message: passwordValidation.message });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password reset successful',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      _id: user._id,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      ...(user.role === 'customer' && {
        gender: user.gender,
        age: user.age,
        height: user.height,
        weight: user.weight,
      }),
      ...(user.role === 'tailor' && {
        shopName: user.shopName,
        location: user.location,
        priceRange: user.priceRange,
      }),
      ...(user.role === 'admin' && {
        username: user.username,
      }),
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update email if provided
    if (req.body.email) {
      // Validate email
      if (!validateEmail(req.body.email)) {
        return res.status(400).json({ message: 'Please enter a valid email address' });
      }
      
      // Check if email already exists for another user
      const existingEmail = await User.findOne({ 
        email: req.body.email, 
        _id: { $ne: user._id } 
      });
      
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use by another account' });
      }
      
      // If email is changing, user needs to verify the new email
      if (user.email !== req.body.email) {
        user.email = req.body.email;
        user.isVerified = false;
        
        // Send verification OTP to new email
        await otpService.sendOTP(req.body.email);
      }
    }
    
    // Update mobile number if provided
    if (req.body.mobileNumber) {
      // Validate and format mobile number
      const mobileValidation = validateMobileNumber(req.body.mobileNumber);
      if (!mobileValidation.isValid) {
        return res.status(400).json({ message: mobileValidation.message });
      }
      
      const formattedMobileNumber = mobileValidation.cleanedNumber;
      
      // Check if mobile number already exists for another user
      const existingUser = await User.findOne({ 
        mobileNumber: formattedMobileNumber, 
        _id: { $ne: user._id } 
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Mobile number already in use by another account' });
      }
      
      user.mobileNumber = formattedMobileNumber;
    }

    // Update password if provided
    if (req.body.password) {
      // Validate password
      const passwordValidation = validatePassword(req.body.password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ message: passwordValidation.message });
      }
      
      user.password = req.body.password;
    }

    // Update role-specific fields
    if (user.role === 'customer') {
      user.gender = req.body.gender || user.gender;
      user.age = req.body.age || user.age;
      user.height = req.body.height || user.height;
      user.weight = req.body.weight || user.weight;
    } else if (user.role === 'tailor') {
      user.shopName = req.body.shopName || user.shopName;
      user.location = req.body.location || user.location;
      
      if (req.body.priceRange) {
        user.priceRange = {
          min: req.body.priceRange.min || user.priceRange.min,
          max: req.body.priceRange.max || user.priceRange.max,
        };
      }
    }

    // Save updated user
    const updatedUser = await user.save();

    // Prepare response
    const response = {
      _id: updatedUser._id,
      email: updatedUser.email,
      mobileNumber: updatedUser.mobileNumber,
      role: updatedUser.role,
      isVerified: updatedUser.isVerified,
      ...(updatedUser.role === 'customer' && {
        gender: updatedUser.gender,
        age: updatedUser.age,
        height: updatedUser.height,
        weight: updatedUser.weight,
      }),
      ...(updatedUser.role === 'tailor' && {
        shopName: updatedUser.shopName,
        location: updatedUser.location,
        priceRange: updatedUser.priceRange,
      }),
    };
    
    // Add message about verification if email was changed
    if (req.body.email && user.email !== req.body.email) {
      response.message = 'Profile updated. Please check your email for a verification code to verify your new email address.';
    } else {
      response.message = 'Profile updated successfully';
    }

    res.json(response);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get customer data (for customer or admin)
// @route   GET /api/auth/customer-data
// @access  Private (Customer, Admin)
const getCustomerData = async (req, res) => {
  try {
    res.json({ message: 'Customer data retrieved successfully' });
  } catch (error) {
    console.error('Get customer data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get tailor data (for tailor or admin)
// @route   GET /api/auth/tailor-data
// @access  Private (Tailor, Admin)
const getTailorData = async (req, res) => {
  try {
    res.json({ message: 'Tailor data retrieved successfully' });
  } catch (error) {
    console.error('Get tailor data error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Debug mobile number formatting
// @route   POST /api/auth/debug-format
// @access  Public
const debugMobileFormat = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    const formattedNumber = formatMobileNumber(mobileNumber);
    
    // Try to find user with this number
    const user = await User.findOne({ mobileNumber: formattedNumber });
    
    res.json({
      original: mobileNumber,
      formatted: formattedNumber,
      userFound: user ? true : false,
      userDetails: user ? {
        _id: user._id,
        mobileNumber: user.mobileNumber,
        role: user.role,
        isVerified: user.isVerified
      } : null
    });
  } catch (error) {
    console.error('Debug format error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    List all users for debugging
// @route   GET /api/auth/debug-users
// @access  Public (should be restricted in production)
const debugListUsers = async (req, res) => {
  try {
    const users = await User.find({});
    
    const simplifiedUsers = users.map(user => ({
      _id: user._id,
      email: user.email,
      mobileNumber: user.mobileNumber,
      role: user.role,
      isVerified: user.isVerified
    }));
    
    res.json({
      count: users.length,
      users: simplifiedUsers
    });
  } catch (error) {
    console.error('Debug list users error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Test Twilio SMS functionality
// @route   POST /api/auth/test-sms
// @access  Public (should be secured in production)
const testSMS = async (req, res) => {
  try {
    const { mobileNumber } = req.body;
    
    if (!mobileNumber) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }
    
    // Validate and format mobile number
    const mobileValidation = validateMobileNumber(mobileNumber);
    if (!mobileValidation.isValid) {
      return res.status(400).json({ message: mobileValidation.message });
    }
    
    const formattedMobileNumber = mobileValidation.cleanedNumber;
    
    // Generate test OTP
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Attempt to send OTP via Twilio
    try {
      const otpResult = await otpService.sendOTP(formattedMobileNumber);
      
      // Return results including debug info in development
      res.json({
        message: 'SMS test completed',
        mobileNumber: formattedMobileNumber,
        success: otpResult.success,
        details: otpResult.message,
        debug: process.env.NODE_ENV !== 'production' ? otpResult.debug : undefined
      });
    } catch (smsError) {
      console.error('SMS test error:', smsError);
      return res.status(500).json({ 
        message: 'SMS delivery failed', 
        error: smsError.message 
      });
    }
  } catch (error) {
    console.error('Test SMS error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check Twilio config
// @route   GET /api/auth/check-twilio
// @access  Public (should be secured in production)
const checkTwilio = async (req, res) => {
  try {
    // Check if Twilio credentials are available
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
    
    const twilioStatus = {
      accountConfigured: !!accountSid,
      authTokenConfigured: !!authToken,
      phoneNumberConfigured: !!phoneNumber,
      allConfigured: !!(accountSid && authToken && phoneNumber)
    };
    
    // Try to initialize Twilio client
    const twilio = require('twilio');
    let clientInitialized = false;
    let accountInfo = null;
    
    if (twilioStatus.allConfigured) {
      try {
        const client = twilio(accountSid, authToken);
        // Mask the actual credentials for security
        const maskedSid = accountSid ? `${accountSid.substring(0, 4)}...${accountSid.substring(accountSid.length - 4)}` : 'not configured';
        const maskedToken = authToken ? `${authToken.substring(0, 2)}...${authToken.substring(authToken.length - 2)}` : 'not configured';
        const maskedPhone = phoneNumber ? `${phoneNumber.substring(0, 4)}...${phoneNumber.substring(phoneNumber.length - 2)}` : 'not configured';
        
        // Get account info (this will verify the credentials are correct)
        try {
          accountInfo = await client.api.accounts(accountSid).fetch();
          clientInitialized = true;
        } catch (accountError) {
          console.error('Error fetching Twilio account:', accountError);
          accountInfo = { 
            error: accountError.message,
            code: accountError.code
          };
        }
        
        // Return the masked info and status
        res.json({
          status: 'Twilio configuration check completed',
          config: {
            accountSid: maskedSid,
            authToken: maskedToken,
            phoneNumber: maskedPhone
          },
          twilioStatus,
          clientInitialized,
          accountInfo: accountInfo ? {
            status: accountInfo.status,
            type: accountInfo.type,
            friendlyName: accountInfo.friendlyName,
            dateCreated: accountInfo.dateCreated
          } : null
        });
      } catch (clientError) {
        console.error('Error initializing Twilio client:', clientError);
        res.json({
          status: 'Error initializing Twilio client',
          twilioStatus,
          error: clientError.message
        });
      }
    } else {
      res.json({
        status: 'Incomplete Twilio configuration',
        twilioStatus
      });
    }
  } catch (error) {
    console.error('Twilio check error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Test SendGrid email functionality
// @route   POST /api/auth/test-email
// @access  Public (should be secured in production)
const testEmail = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    // Validate email
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }
    
    // Generate test OTP
    const testOTP = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Attempt to send OTP via email
    try {
      const otpResult = await otpService.sendOTP(email);
      
      // Return results including debug info in development
      res.json({
        message: 'Email test completed',
        email,
        success: otpResult.success,
        details: otpResult.message,
        debug: process.env.NODE_ENV !== 'production' ? otpResult.debug : undefined
      });
    } catch (emailError) {
      console.error('Email test error:', emailError);
      return res.status(500).json({ 
        message: 'Email delivery failed', 
        error: emailError.message 
      });
    }
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Check SendGrid config
// @route   GET /api/auth/check-sendgrid
// @access  Public (should be secured in production)
const checkSendGrid = async (req, res) => {
  try {
    // Check if SendGrid API key is available
    const apiKey = process.env.SENDGRID_API_KEY;
    
    const sendgridStatus = {
      apiKeyConfigured: !!apiKey,
      allConfigured: !!apiKey
    };
    
    // Mask the API key for security
    const maskedApiKey = apiKey ? 
      `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}` : 
      'not configured';
    
    res.json({
      status: 'SendGrid configuration check completed',
      config: {
        apiKey: maskedApiKey
      },
      sendgridStatus
    });
  } catch (error) {
    console.error('SendGrid check error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  signup,
  login,
  adminLogin,
  verifyOTP,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  getCustomerData,
  getTailorData,
  debugMobileFormat,
  debugListUsers,
  testSMS,
  checkTwilio,
  testEmail,
  checkSendGrid,
};
