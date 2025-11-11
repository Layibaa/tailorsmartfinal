// tailor-smart-mob-app/src/styles/colors.js
// Enhanced with order status colors and fallbacks

const colors = {
  // Primary colors
  black: '#000000',
  white: '#FFFFFF',
  
  // Gray scale
  lightGray: '#F5F5F5',
  gray: '#999999',
  darkGray: '#666666',
  
  // Status colors
  success: '#28a745',
  error: '#dc3545',
  warning: '#ffc107',
  info: '#17a2b8',
  
  // Order status colors
  pending: '#ffc107',      // Yellow/Warning
  accepted: '#17a2b8',     // Blue/Info
  rejected: '#dc3545',     // Red/Error
  confirmed: '#007bff',    // Blue
  making: '#fd7e14',       // Orange
  payment_done: '#6f42c1', // Purple
  completed: '#28a745',    // Green/Success
  
  // UI colors
  primary: '#000000',
  secondary: '#666666',
  background: '#FFFFFF',
  text: '#000000',
  textSecondary: '#666666',
  border: '#E0E0E0',
  
  // Additional
  transparent: 'transparent'
};

export default colors;