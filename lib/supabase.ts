// lib/supabase.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

// ✅ Hardcoded fallback (safe for now)
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://rvfrvfuptndqlizrfukl.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2ZnJ2ZnVwdG5kcWxpenJmdWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3Njg3MDYsImV4cCI6MjA5MDM0NDcwNn0.jvwZr8s5w-od0yA7w8SrDspP0HRlp4tp9RYDUkfBLZU';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.warn('⚠️ Using hardcoded Supabase credentials (env vars not loaded)');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Helper function
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.error('Error getting user:', error);
    return null;
  }
};