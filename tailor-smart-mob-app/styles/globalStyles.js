import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Base colors
  primary: '#3B82F6', // Soft blue highlight
  secondary: '#6B7280',
  
  // Neutral colors
  white: '#FFFFFF',
  black: '#000000',
  gray: '#6B7280',
  lightGray: '#E5E7EB',
  
  // Utility colors
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
  
  // App specific colors
  lightBlue: '#EFF6FF',
};

export const SIZES = {
  // Global sizes
  base: 8,
  font: 14,
  radius: 12,
  padding: 12,
  
  // Font sizes
  largeTitle: 40,
  h1: 30,
  h2: 22,
  h3: 18,
  h4: 16,
  body1: 30,
  body2: 22,
  body3: 16,
  body4: 14,
  body5: 12,
  
  // App dimensions
  width,
  height,
};

export const FONTS = {
  largeTitle: { fontFamily: 'Poppins_700Bold', fontSize: SIZES.largeTitle },
  h1: { fontFamily: 'Poppins_700Bold', fontSize: SIZES.h1, lineHeight: 36 },
  h2: { fontFamily: 'Poppins_600SemiBold', fontSize: SIZES.h2, lineHeight: 30 },
  h3: { fontFamily: 'Poppins_600SemiBold', fontSize: SIZES.h3, lineHeight: 22 },
  h4: { fontFamily: 'Poppins_500Medium', fontSize: SIZES.h4, lineHeight: 20 },
  body1: { fontFamily: 'Poppins_400Regular', fontSize: SIZES.body1, lineHeight: 36 },
  body2: { fontFamily: 'Poppins_400Regular', fontSize: SIZES.body2, lineHeight: 30 },
  body3: { fontFamily: 'Poppins_400Regular', fontSize: SIZES.body3, lineHeight: 22 },
  body4: { fontFamily: 'Poppins_400Regular', fontSize: SIZES.body4, lineHeight: 20 },
  body5: { fontFamily: 'Poppins_400Regular', fontSize: SIZES.body5, lineHeight: 18 },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;
