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
  
  primary: '#007AFF', // Blue - for auto-fill and main actions
  secondary: '#5856D6',

  // Additional
  transparent: 'transparent',

    // Primary colors
  primary: '#007AFF', // Blue - for auto-fill and main actions
  secondary: '#5856D6',
  
  // Neutral colors
  black: '#000000',
  white: '#FFFFFF',
  gray: '#8E8E93',
  lightGray: '#E5E5EA',
  darkGray: '#636366',
  
  // Status colors
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#007AFF',
  
  // Order status colors
  pending: '#FF9500',
  accepted: '#007AFF',
  rejected: '#FF3B30',
  confirmed: '#5856D6',
  making: '#FF9500',
  payment_done: '#34C759',
  completed: '#34C759',
  
  // Background colors
  background: '#F2F2F7',
  cardBackground: '#FFFFFF',
  
  // Text colors
  textPrimary: '#000000',
  textSecondary: '#8E8E93',
  textDisabled: '#C7C7CC',
  
  // Border colors
  border: '#E5E5EA',
  borderDark: '#C7C7CC',
  
  // Additional UI colors
  placeholder: '#C7C7CC',
  separator: '#E5E5EA',
  shadow: '#000000',
  
  // Specific feature colors
  autofill: '#007AFF',
  autofillLight: '#E3F2FD',
  disabled: '#C7C7CC'
};

export default colors;