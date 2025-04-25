import * as Yup from 'yup';

// Password regex patterns
const passwordRegex = {
  uppercase: /(?=.*[A-Z])/,
  specialChar: /(?=.*[!@#$%^&*(),.?":{}|<>])/,
  number: /(?=.*[0-9])/,
};

// Login validation schema
export const loginSchema = Yup.object().shape({
  mobileNumber: Yup.string()
    .matches(/^[0-9]+$/, 'Mobile number must contain only digits')
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must not exceed 15 digits')
    .required('Mobile number is required'),
  password: Yup.string()
    .required('Password is required'),
});

// Common user details validation
const userDetailsSchema = {
  mobileNumber: Yup.string()
    .matches(/^[0-9]+$/, 'Mobile number must contain only digits')
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must not exceed 15 digits')
    .required('Mobile number is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(passwordRegex.uppercase, 'Password must contain at least one uppercase letter')
    .matches(passwordRegex.specialChar, 'Password must contain at least one special character')
    .matches(passwordRegex.number, 'Password must contain at least one number')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
};

// Customer registration validation schema
export const customerRegistrationSchema = Yup.object().shape({
  ...userDetailsSchema,
  gender: Yup.string()
    .oneOf(['male', 'female', 'other'], 'Invalid gender')
    .required('Gender is required'),
  age: Yup.number()
    .positive('Age must be positive')
    .integer('Age must be an integer')
    .required('Age is required'),
  height: Yup.number()
    .positive('Height must be positive')
    .required('Height is required'),
  weight: Yup.number()
    .positive('Weight must be positive')
    .required('Weight is required'),
});

// Tailor registration validation schema
export const tailorRegistrationSchema = Yup.object().shape({
  ...userDetailsSchema,
  shopName: Yup.string()
    .required('Shop name is required'),
  location: Yup.string()
    .required('Location is required'),
  priceRangeMin: Yup.number()
    .positive('Price must be positive')
    .required('Minimum price is required'),
  priceRangeMax: Yup.number()
    .positive('Price must be positive')
    .moreThan(Yup.ref('priceRangeMin'), 'Maximum price must be greater than minimum price')
    .required('Maximum price is required'),
});

// OTP verification schema
export const otpVerificationSchema = Yup.object().shape({
  otp: Yup.string()
    .matches(/^[0-9]+$/, 'OTP must contain only digits')
    .length(6, 'OTP must be exactly 6 digits')
    .required('OTP is required'),
});

// Forgot password schema
export const forgotPasswordSchema = Yup.object().shape({
  mobileNumber: Yup.string()
    .matches(/^[0-9]+$/, 'Mobile number must contain only digits')
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must not exceed 15 digits')
    .required('Mobile number is required'),
});

// Reset password schema
export const resetPasswordSchema = Yup.object().shape({
  newPassword: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(passwordRegex.uppercase, 'Password must contain at least one uppercase letter')
    .matches(passwordRegex.specialChar, 'Password must contain at least one special character')
    .matches(passwordRegex.number, 'Password must contain at least one number')
    .required('New password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
    .required('Confirm password is required'),
});

// Admin login schema
export const adminLoginSchema = Yup.object().shape({
  username: Yup.string()
    .required('Username is required'),
  password: Yup.string()
    .required('Password is required'),
});
