const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Tailor = require('../models/Tailor');
const Otp = require('../models/Otp');
const sendEmail = require('../utils/sendEmail');
require('dotenv').config();

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Register new customer
const registerCustomer = async (req, res) => {
  try {
    const { fullName, email, password, gender, age, height, weight } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate password
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must contain at least 1 uppercase letter, 1 number, 1 special character, and be at least 8 characters long'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = await User.create({
      fullName,
      email,
      password: hashedPassword,
      gender,
      age,
      height,
      weight
    });

    // Generate OTP for verification
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    // Save OTP to database
    await Otp.create({
      email,
      otp,
      type: 'verification',
      expiresAt: otpExpiry
    });

    // Send verification email
    const emailSubject = 'TailorSmart Account Verification';
    const emailText = `Welcome to TailorSmart! Your verification code is: ${otp}`;
    await sendEmail(email, emailSubject, emailText);

    const user = newUser.toObject();
    delete user.password; // Don't return password in response

    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      user,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Register new tailor
const registerTailor = async (req, res) => {
  try {
    const { fullName, email, password, shopName, shopLocation, averagePriceRange } = req.body;

    // Check if tailor already exists
    const tailorExists = await Tailor.findOne({ email });
    if (tailorExists) {
      return res.status(400).json({ message: 'Tailor already exists' });
    }

    // Validate password
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message: 'Password must contain at least 1 uppercase letter, 1 number, 1 special character, and be at least 8 characters long'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create tailor
    const newTailor = await Tailor.create({
      fullName,
      email,
      password: hashedPassword,
      shopName,
      shopLocation,
      averagePriceRange
    });

    // Generate OTP for verification
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    // Save OTP to database
    await Otp.create({
      email,
      otp,
      type: 'verification',
      expiresAt: otpExpiry
    });

    // Send verification email
    const emailSubject = 'TailorSmart Account Verification';
    const emailText = `Welcome to TailorSmart! Your verification code is: ${otp}`;
    await sendEmail(email, emailSubject, emailText);

    const tailor = newTailor.toObject();
    delete tailor.password; // Don't return password in response

    res.status(201).json({
      message: 'Tailor registered successfully. Please verify your email.',
      user: tailor,
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists (check both User and Tailor models)
    let user = await User.findOne({ email }).select('+password');
    let role = 'customer';

    if (!user) {
      user = await Tailor.findOne({ email }).select('+password');
      role = 'tailor';
    }

    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(401).json({ 
        message: 'Please verify your email first',
        userId: user._id
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role },
      process.env.JWT_SECRET || 'tailorsmart_jwt_secret',
      { expiresIn: '24h' }
    );

    // Don't return password
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: 'Login successful',
      token,
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin login
const adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    // For admin, we're using hardcoded credentials as specified in project requirements
    // In a production app, we would store this in the database with proper encryption
    const adminUsername = 'admin@tailorsmart.com';
    const adminPassword = 'Admin@123';

    if (username !== adminUsername || password !== adminPassword) {
      return res.status(400).json({ message: 'Invalid admin credentials' });
    }

    // Create JWT token
    const token = jwt.sign(
      { username, role: 'admin' },
      process.env.JWT_SECRET || 'tailorsmart_jwt_secret',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      message: 'Admin login successful',
      token,
      user: {
        username,
        role: 'admin'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Verify OTP
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Check if OTP exists and is valid
    const otpRecord = await Otp.findOne({
      email,
      otp,
      type: 'verification',
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Update user to verified (check both customer and tailor models)
    let user = await User.findOne({ email });
    let role = 'customer';
    
    if (!user) {
      user = await Tailor.findOne({ email });
      role = 'tailor';
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.isVerified = true;
    await user.save();

    // Delete the used OTP
    await Otp.findByIdAndDelete(otpRecord._id);

    // Create JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role },
      process.env.JWT_SECRET || 'tailorsmart_jwt_secret',
      { expiresIn: '24h' }
    );

    // Don't return password
    const userData = user.toObject();
    delete userData.password;

    res.status(200).json({
      message: 'Email verified successfully',
      token,
      user: userData
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists (check both models)
    let user = await User.findOne({ email });
    if (!user) {
      user = await Tailor.findOne({ email });
    }

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    // Generate OTP for password reset
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10); // OTP valid for 10 minutes

    // Save OTP to database
    await Otp.create({
      email,
      otp,
      type: 'reset',
      expiresAt: otpExpiry
    });

    // Send reset email
    const emailSubject = 'TailorSmart Password Reset';
    const emailText = `Your password reset code is: ${otp}`;
    await sendEmail(email, emailSubject, emailText);

    res.status(200).json({
      message: 'Password reset OTP sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Validate password
    const passwordRegex = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        message: 'Password must contain at least 1 uppercase letter, 1 number, 1 special character, and be at least 8 characters long'
      });
    }

    // Check if OTP exists and is valid
    const otpRecord = await Otp.findOne({
      email,
      otp,
      type: 'reset',
      expiresAt: { $gt: new Date() }
    });

    if (!otpRecord) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password (check both models)
    let user = await User.findOne({ email });
    if (user) {
      user.password = hashedPassword;
      await user.save();
    } else {
      let tailor = await Tailor.findOne({ email });
      if (tailor) {
        tailor.password = hashedPassword;
        await tailor.save();
      } else {
        return res.status(404).json({ message: 'User not found' });
      }
    }

    // Delete the used OTP
    await Otp.findByIdAndDelete(otpRecord._id);

    res.status(200).json({
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  registerCustomer,
  registerTailor,
  login,
  adminLogin,
  verifyOtp,
  forgotPassword,
  resetPassword
};