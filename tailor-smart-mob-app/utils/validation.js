// Email validation
export const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // Password validation (min 6 characters)
  export const validatePassword = (password) => {
    return password && password.length >= 6;
  };
  
  // Phone number validation (basic format)
  export const validatePhone = (phone) => {
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    return phoneRegex.test(phone);
  };
  
  // Name validation (non-empty, valid characters)
  export const validateName = (name) => {
    return name && name.trim().length > 0 && /^[a-zA-Z\s'-]+$/.test(name);
  };
  
  // Numeric value validation (positive number)
  export const validateNumeric = (value) => {
    return value && !isNaN(value) && parseFloat(value) >= 0;
  };
  
  // Form validation helper (checks all fields with their validators)
  export const validateForm = (data, validationRules) => {
    const errors = {};
    
    Object.keys(validationRules).forEach(field => {
      const value = data[field];
      const rules = validationRules[field];
      
      if (rules.required && (!value || value.trim() === '')) {
        errors[field] = `${field} is required`;
      } else if (rules.validator && value && !rules.validator(value)) {
        errors[field] = rules.message || `Invalid ${field}`;
      }
    });
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  // Order validation
  export const validateOrderData = (orderData) => {
    const errors = {};
    
    if (!orderData.garmentType) {
      errors.garmentType = 'Please select a garment type';
    }
    
    if (!orderData.tailorId) {
      errors.tailorId = 'Please select a tailor';
    }
    
    if (!orderData.description || orderData.description.trim() === '') {
      errors.description = 'Please provide a description';
    }
    
    // Check if at least one measurement is provided
    const hasMeasurement = orderData.measurements && Object.values(orderData.measurements).some(
      m => m && m.toString().trim() !== ''
    );
    
    if (!hasMeasurement) {
      errors.measurements = 'Please provide at least one measurement';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
  
  // Profile validation
  export const validateProfileData = (profileData) => {
    const errors = {};
    
    if (!validateName(profileData.name)) {
      errors.name = 'Please enter a valid name';
    }
    
    if (!validateEmail(profileData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (profileData.phone && !validatePhone(profileData.phone)) {
      errors.phone = 'Please enter a valid phone number';
    }
    
    // Validate tailor-specific fields if the profile is for a tailor
    if (profileData.isTailor) {
      if (!profileData.shopName || profileData.shopName.trim() === '') {
        errors.shopName = 'Shop name is required';
      }
      
      if (!profileData.location || profileData.location.trim() === '') {
        errors.location = 'Location is required';
      }
      
      if (!profileData.priceRange || profileData.priceRange.trim() === '') {
        errors.priceRange = 'Price range is required';
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };