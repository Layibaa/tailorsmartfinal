// TailorSmart App Theme
const colors = {
  // Primary colors
  primary: '#4A90E2', // Soft blue
  secondary: '#F5A623', // Gold accent
  
  // Text colors
  text: '#333333', // Dark text
  textLight: '#757575', // Light text / secondary text
  
  // Background colors
  background: '#F9F9F9', // Main background
  white: '#FFFFFF',
  
  // Status colors
  success: '#4CAF50', // Green
  error: '#F44336', // Red
  warning: '#FF9800', // Orange
  info: '#2196F3', // Blue
  
  // Neutrals
  lightGray: '#EEEEEE',
  border: '#E0E0E0',
  shadow: '#000000',
  
  // Accent
  gold: '#F5A623',
};

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  heading1: 24,
  heading2: 20,
  heading3: 18,
  heading4: 16,
};

const fontFamily = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
};

const shadow = {
  small: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  medium: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  large: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
};

// Exporting the theme
export const theme = {
  colors,
  spacing,
  borderRadius,
  fontSize,
  fontFamily,
  shadow,
};
