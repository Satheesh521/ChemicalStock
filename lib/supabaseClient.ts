/**
 * Supabase client initialization
 * Configure with your Supabase project details
 */

import { createClient } from '@supabase/supabase-js';

// Get environment variables
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate environment variables
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    'Warning: SUPABASE_URL or SUPABASE_ANON_KEY is not defined. ' +
    'Ensure these are set in your .env.local or environment configuration.'
  );
}

/**
 * Initialize and export Supabase client
 * This client uses the anonymous key and relies on RLS for security
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Helper function to get the current authenticated user
 * @returns User ID or null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      console.error('Failed to get current user:', error?.message);
      return null;
    }

    return user.id;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

/**
 * Helper function to get the current user's session
 * @returns Session object or null
 */
export async function getCurrentSession() {
  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Failed to get session:', error.message);
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

/**
 * Helper function to verify user is authenticated
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('User must be authenticated to perform this action');
  }
  return userId;
}
