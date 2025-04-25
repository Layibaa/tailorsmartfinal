const OTP = require('../models/OTP');
const { sendOTPEmail } = require('./emailService');
const { validateEmail } = require('../utils/validationUtils');

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save OTP to database
const saveOTP = async (email, otp) => {
  try {
    // Delete any existing OTP for this email
    await OTP.deleteMany({ email });
    
    // Create new OTP record
    const otpRecord = new OTP({
      email,
      otp,
    });
    
    await otpRecord.save();
    return otpRecord;
  } catch (error) {
    console.error('Error saving OTP to database:', error);
    throw error;
  }
};

// Main function to send OTP
const sendOTP = async (email) => {
  try {
    if (!email) {
      throw new Error('Email is required');
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    // Generate OTP
    const otp = generateOTP();
    
    // Save OTP to database
    await saveOTP(email, otp);
    
    try {
      // Try to send via email
      const emailResult = await sendOTPEmail(email, otp);
      
      if (!emailResult.success) {
        console.error('Failed to send OTP via email:', emailResult.message);
        console.log(`Debug info - OTP that would be sent: ${otp} to ${email}`);
        // We don't rethrow here - allow the function to continue
        // The OTP is still saved to the database and can be used for testing
        return {
          success: false,
          message: `OTP saved but email delivery failed: ${emailResult.message}`,
          debug: { otp }
        };
      }
      
      console.log(`OTP ${otp} successfully sent to ${email}`);
      return {
        success: true,
        message: 'OTP sent successfully'
      };
    } catch (emailError) {
      console.error('Failed to send OTP via email:', emailError);
      console.log(`Debug info - OTP that would be sent: ${otp} to ${email}`);
      // We don't rethrow here - allow the function to continue
      return {
        success: false,
        message: `OTP saved but email delivery failed: ${emailError.message}`,
        debug: { otp }
      };
    }
  } catch (error) {
    console.error('OTP service error:', error);
    throw new Error(`Failed to process OTP: ${error.message}`);
  }
};

// Verify OTP
const verifyOTP = async (email, otp) => {
  try {
    if (!email || !otp) {
      throw new Error('Email and OTP are required');
    }
    
    // Validate email format
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }
    
    console.log(`Verifying OTP ${otp} for email ${email}`);
    
    // Get the current OTP record
    const otpRecord = await OTP.findOne({ email });
    
    if (!otpRecord) {
      console.log(`No OTP record found for ${email}`);
      return false;
    }
    
    console.log(`Found OTP record: ${otpRecord.otp} for ${email}`);
    
    // Check if OTP matches
    if (otpRecord.otp !== otp) {
      console.log(`OTP mismatch: Expected ${otpRecord.otp}, received ${otp}`);
      return false;
    }
    
    // Delete the OTP record
    await OTP.deleteOne({ _id: otpRecord._id });
    console.log(`OTP verified and deleted for ${email}`);
    
    return true;
  } catch (error) {
    console.error('OTP verification error:', error);
    throw new Error(`Failed to verify OTP: ${error.message}`);
  }
};

module.exports = { sendOTP, verifyOTP };
