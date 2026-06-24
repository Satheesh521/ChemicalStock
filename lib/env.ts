/**
 * Environment Variables Configuration - FIXED for APK builds
 */

// Define the shape of environment variables
interface EnvConfig {
  EXPO_PUBLIC_SUPABASE_URL: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
  EXPO_PUBLIC_APP_NAME: string;
  EXPO_PUBLIC_DEBUG: string;
  EXPO_PUBLIC_ENABLE_LOGGING: string;
  EXPO_PUBLIC_FIREBASE_API_KEY?: string;
  EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN?: string;
  EXPO_PUBLIC_FIREBASE_PROJECT_ID?: string;
  EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET?: string;
  EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?: string;
  EXPO_PUBLIC_FIREBASE_APP_ID?: string;
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?: string;
  EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID?: string;
  EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS?: string;
}

function getEnvVar(key: keyof EnvConfig, required = true): string {
  // ✅ FIXED: Direct environment variable access
  const value = process.env[key as string];
  
  if (required && !value) {
    console.warn(`⚠️ Missing environment variable: ${key}`);
  }
  
  return value || '';
}

export const env: EnvConfig = {
  EXPO_PUBLIC_SUPABASE_URL: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
  EXPO_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  EXPO_PUBLIC_APP_NAME: getEnvVar('EXPO_PUBLIC_APP_NAME', false) || 'ChemicalStock',
  EXPO_PUBLIC_DEBUG: getEnvVar('EXPO_PUBLIC_DEBUG', false) || 'true',
  EXPO_PUBLIC_ENABLE_LOGGING: getEnvVar('EXPO_PUBLIC_ENABLE_LOGGING', false) || 'true',
  EXPO_PUBLIC_FIREBASE_API_KEY: getEnvVar('EXPO_PUBLIC_FIREBASE_API_KEY', false),
  EXPO_PUBLIC_FIREBASE_PROJECT_ID: getEnvVar('EXPO_PUBLIC_FIREBASE_PROJECT_ID', false),
  EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID: getEnvVar('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', false),
  EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID: getEnvVar('EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID', false),
  EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS: getEnvVar('EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS', false) || 'false',
};

export const isDebugMode = (): boolean => env.EXPO_PUBLIC_DEBUG === 'true';
export const isLoggingEnabled = (): boolean => env.EXPO_PUBLIC_ENABLE_LOGGING === 'true';
export const isPushNotificationsEnabled = (): boolean => env.EXPO_PUBLIC_ENABLE_PUSH_NOTIFICATIONS === 'false';

export const validateSupabaseConfig = (): boolean => {
  if (!env.EXPO_PUBLIC_SUPABASE_URL) {
    console.error('❌ EXPO_PUBLIC_SUPABASE_URL is required');
    return false;
  }
  if (!env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.EXPO_PUBLIC_SUPABASE_ANON_KEY === 'your-anon-key-here') {
    console.error('❌ EXPO_PUBLIC_SUPABASE_ANON_KEY is required');
    return false;
  }
  return true;
};

// ✅ REMOVED debug console.log for production

export default env;