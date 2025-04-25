// Validate email format
const validateEmail = (email) => {
  if (!email) return false;
  
  // Email regex pattern
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate email with detailed feedback
const validateEmailWithFeedback = (email) => {
  if (!email) {
    return {
      isValid: false,
      message: 'Email is required',
    };
  }
  
  if (!validateEmail(email)) {
    return {
      isValid: false,
      message: 'Please enter a valid email address',
    };
  }
  
  return {
    isValid: true,
  };
};

// Validate password requirements
const validatePassword = (password) => {
  // Check minimum length
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'Password must be at least 8 characters',
    };
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one uppercase letter',
    };
  }

  // Check for special character
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one special character',
    };
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    return {
      isValid: false,
      message: 'Password must contain at least one number',
    };
  }

  return {
    isValid: true,
  };
};

// Format mobile number (remove all non-numeric characters except + at beginning)
const formatMobileNumber = (mobileNumber) => {
  if (!mobileNumber) return '';
  
  // First remove all spaces and special characters
  const cleaned = mobileNumber.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  
  // Handle the + sign correctly
  if (cleaned.startsWith('+')) {
    return cleaned;
  } else if (/^\d+$/.test(cleaned)) {
    // If it's all digits without +, check if it has a country code
    if (cleaned.length > 10) {
      // Assume the first part is country code - ensure it has a + prefix
      return `+${cleaned}`;
    }
    // Otherwise just return the digits as is
    return cleaned;
  }
  
  return cleaned;
};

// Validate mobile number
const validateMobileNumber = (mobileNumber) => {
  if (!mobileNumber) {
    return {
      isValid: false,
      message: 'Mobile number is required',
    };
  }
  
  // Format the mobile number
  const cleanedNumber = formatMobileNumber(mobileNumber);
  
  // Check if it has a valid format (8-15 digits with optional + prefix)
  if (!/^\+?\d{8,15}$/.test(cleanedNumber)) {
    return {
      isValid: false,
      message: 'Mobile number must be between 8 and 15 digits',
    };
  }

  return {
    isValid: true,
    cleanedNumber
  };
};

// Validate OTP
const validateOTP = (otp) => {
  // OTP should be 6 digits
  if (!/^\d{6}$/.test(otp)) {
    return {
      isValid: false,
      message: 'OTP must be 6 digits',
    };
  }

  return {
    isValid: true,
  };
};

module.exports = {
  validatePassword,
  validateMobileNumber,
  validateOTP,
  formatMobileNumber,
  validateEmail,
  validateEmailWithFeedback,
};
