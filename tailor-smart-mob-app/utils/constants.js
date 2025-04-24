import { Platform } from 'react-native';

// Base API URL (use environment variable if available)
export const API_URL = 'http://localhost:8000';

// App constants
export const APP_NAME = 'TailorSmart';
export const APP_VERSION = '1.0.0';

// Supported garment types
export const GARMENT_TYPES = [
  { id: 'shirt', label: 'Shirt', icon: 'shirt-outline' },
  { id: 'pants', label: 'Pants', icon: 'wallet-outline' },
  { id: 'dress', label: 'Dress', icon: 'woman-outline' },
  { id: 'suit', label: 'Suit', icon: 'business-outline' },
  { id: 'other', label: 'Other', icon: 'cube-outline' },
];

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// User roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  TAILOR: 'tailor',
  ADMIN: 'admin',
};

// Notification types
export const NOTIFICATION_TYPES = {
  ORDER: 'order',
  MESSAGE: 'message',
  SYSTEM: 'system',
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER_DATA: 'userData',
  THEME: 'appTheme',
  NOTIFICATIONS: 'notificationSettings',
};

// Pagination defaults
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
};

// Platform specific constants
export const IS_IOS = Platform.OS === 'ios';
export const IS_ANDROID = Platform.OS === 'android';

// Image picker options
export const IMAGE_PICKER_OPTIONS = {
  mediaTypes: 'Images',
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.8,
};