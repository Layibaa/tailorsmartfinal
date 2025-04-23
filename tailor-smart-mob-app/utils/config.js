// API and app configuration settings

// Use the local server for development
export const API_URL = 'http://localhost:5000';

// For production/deployed version
// export const API_URL = 'https://api.tailorsmart.com';

// App version
export const APP_VERSION = '1.0.0';

// Feature flags
export const FEATURES = {
  SMART_MEASUREMENTS: true,
  SKETCH_RECOGNITION: false,
  DELIVERY_PREDICTION: true,
};

// Default settings
export const DEFAULTS = {
  PAGINATION_LIMIT: 10,
  CURRENCY: 'USD',
  MEASUREMENTS_UNIT: 'in', // 'in' or 'cm'
};