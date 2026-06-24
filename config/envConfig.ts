// config/envConfig.ts
// Environment configuration for Expo APK builds

// Load environment variables with proper fallbacks
const getEnvVar = (key: string, fallback: string = ''): string => {
  const value = process.env[key];
  if (!value) {
    console.warn(`⚠️ Environment variable ${key} is missing, using fallback: ${fallback}`);
  }
  return value || fallback;
};

// Firebase configuration
export const firebaseConfig = {
  apiKey: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnvVar('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnvVar('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnvVar('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnvVar('EXPO_PUBLIC_FIREBASE_APP_ID'),
};

// Supabase configuration
export const supabaseConfig = {
  url: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
  anonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
};

// Google Sign-In configuration
export const googleConfig = {
  androidClientId: getEnvVar('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID'),
  expoClientId: getEnvVar('EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID'),
  iosClientId: getEnvVar('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID'),
  webClientId: getEnvVar('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID'),
};

// App configuration
export const appConfig = {
  name: 'Chemical Stock',
  version: '1.0.0',
  buildNumber: '1',
  environment: getEnvVar('NODE_ENV', 'development'),
  enableLogging: getEnvVar('EXPO_PUBLIC_ENABLE_LOGGING', 'true') === 'true',
  enableDebugMode: getEnvVar('EXPO_PUBLIC_DEBUG', 'false') === 'true',
};

// Debug function to verify environment
export const debugEnvironment = (): void => {
  console.log('🔍 Environment Debug Info:');
  console.log('Firebase Config:', firebaseConfig);
  console.log('Supabase Config:', supabaseConfig);
  console.log('Google Config:', googleConfig);
  console.log('App Config:', appConfig);
  console.log('All Environment Variables:', Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC_')));
};

// Validate all required environment variables
export const validateEnvironment = (): boolean => {
  const requiredFirebase = ['apiKey', 'projectId', 'appId'];
  const requiredSupabase = ['url', 'anonKey'];
  
  const missingFirebase = requiredFirebase.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  const missingSupabase = requiredSupabase.filter(key => !supabaseConfig[key as keyof typeof supabaseConfig]);
  
  if (missingFirebase.length > 0) {
    console.error('❌ Missing Firebase config:', missingFirebase);
    return false;
  }
  
  if (missingSupabase.length > 0) {
    console.error('❌ Missing Supabase config:', missingSupabase);
    return false;
  }
  
  console.log('✅ Environment validation passed');
  return true;
};

export default {
  firebaseConfig,
  supabaseConfig,
  googleConfig,
  appConfig,
  debugEnvironment,
  validateEnvironment,
};
