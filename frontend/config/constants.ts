export const API_BASE_URL = __DEV__ 
  ? 'http://10.166.116.55:8000' 
  : 'https://your-production-api.com';

export const APP_CONFIG = {
  // API Configuration
  API_TIMEOUT: 10000,
  API_RETRY_ATTEMPTS: 3,
  
  // Storage Keys
  STORAGE_KEYS: {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    REMEMBER_ME: 'remember_me',
    OFFLINE_DATA: 'offline_data',
    LAST_SYNC: 'last_sync',
    APP_SETTINGS: 'app_settings',
  },
  
  // App Configuration
  APP_NAME: 'Chemical Stock Maintenance',
  APP_VERSION: '1.0.0',
  SUPPORT_EMAIL: 'support@chemicalstock.com',
  
  // UI Configuration
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEBOUNCE_DELAY: 500,
  
  // Scanner Configuration
  SCANNER_TIMEOUT: 30000,
  SCAN_COOLDOWN: 1000,
  
  // Notification Configuration
  NOTIFICATION_TYPES: {
    LOW_STOCK: 'low_stock',
    EXPIRY_WARNING: 'expiry_warning',
    STOCK_OUT: 'stock_out',
    SYSTEM_UPDATE: 'system_update',
  },
  
  // Report Configuration
  REPORT_TYPES: {
    STOCK_LEVEL: 'stock_level',
    USAGE_ANALYSIS: 'usage_analysis',
    EXPIRY_REPORT: 'expiry_report',
    LOW_STOCK_REPORT: 'low_stock_report',
    AUDIT_LOG: 'audit_log',
  },
  
  // File Upload Configuration
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  
  // Cache Configuration
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  OFFLINE_MODE_ENABLED: true,
  
  // Security Configuration
  SESSION_TIMEOUT: 60 * 60 * 1000, // 1 hour
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  
  // Date/Time Configuration
  DATE_FORMAT: 'YYYY-MM-DD',
  TIME_FORMAT: 'HH:mm:ss',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss',
  
  // Stock Configuration
  DEFAULT_LOW_STOCK_THRESHOLD: 5,
  DEFAULT_EXPIRY_WARNING_DAYS: 30,
  DEFAULT_MAX_STOCK_QUANTITY: 1000,
  
  // Role Permissions
  PERMISSIONS: {
    ADMIN: [
      'user.create', 'user.read', 'user.update', 'user.delete',
      'chemical.create', 'chemical.read', 'chemical.update', 'chemical.delete',
      'inventory.create', 'inventory.read', 'inventory.update', 'inventory.delete',
      'vendor.create', 'vendor.read', 'vendor.update', 'vendor.delete',
      'po.create', 'po.read', 'po.update', 'po.delete', 'po.approve',
      'report.read', 'report.export',
      'settings.read', 'settings.update',
      'audit.read',
    ],
    SUPERVISOR: [
      'chemical.read', 'inventory.create', 'inventory.read', 'inventory.update',
      'report.read', 'sds.read',
      'notifications.read',
    ],
  },
  
  // Error Messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network connection error. Please check your internet connection.',
    INVALID_CREDENTIALS: 'Invalid employee ID or password.',
    SESSION_EXPIRED: 'Your session has expired. Please login again.',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action.',
    SERVER_ERROR: 'Server error. Please try again later.',
    OFFLINE_MODE: 'You are currently offline. Some features may be limited.',
  },
  
  // Success Messages
  SUCCESS_MESSAGES: {
    LOGIN_SUCCESS: 'Login successful!',
    LOGOUT_SUCCESS: 'Logout successful!',
    DATA_SAVED: 'Data saved successfully!',
    DATA_DELETED: 'Data deleted successfully!',
    SCAN_SUCCESS: 'Item scanned successfully!',
    SYNC_SUCCESS: 'Data synchronized successfully!',
  },
};

export const COLORS = {
  PRIMARY: '#49d137',
  SECONDARY: '#17a2b8',
  SUCCESS: '#28a745',
  WARNING: '#ffc107',
  DANGER: '#dc3545',
  INFO: '#17a2b8',
  LIGHT: '#f8f9fa',
  DARK: '#343a40',
  MUTED: '#6c757d',
  WHITE: '#ffffff',
  BLACK: '#000000',
  GRAY: '#6c757d',
};

export const SIZES = {
  PADDING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
  },
  MARGIN: {
    XS: 2,
    SM: 4,
    MD: 8,
    LG: 16,
    XL: 24,
  },
  FONT: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
  },
  BORDER: {
    XS: 1,
    SM: 2,
    MD: 4,
    LG: 6,
    XL: 8,
  },
  RADIUS: {
    XS: 4,
    SM: 6,
    MD: 8,
    LG: 12,
    XL: 16,
  },
};

export const UNITS = {
  WEIGHT: ['kg', 'g', 'mg'],
  VOLUME: ['l', 'ml'],
  ALL: ['kg', 'g', 'mg', 'l', 'ml'],
};

export const DANGER_LEVELS = {
  LOW: { color: '#28a745', label: 'Low' },
  MEDIUM: { color: '#ffc107', label: 'Medium' },
  HIGH: { color: '#fd7e14', label: 'High' },
  EXTREME: { color: '#dc3545', label: 'Extreme' },
};
